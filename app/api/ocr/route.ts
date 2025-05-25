import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
// This 'gemini' instance is now assumed to be configured for your Gemma vision model
import { gemini } from '@/utils/models'; // Adjust path as necessary

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '未提供图片文件' }, {
        status: 400,
      });
    }

    // Server-side file size check (e.g., 5MB for vision models, adjust as needed)
    // For Gemma vision models, check their specific recommendations for image size.
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes, adjust as needed
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: `图片文件过大，请确保小于 ${MAX_FILE_SIZE / (1024*1024)}MB` }, {
        status: 413, // Payload Too Large
      });
    }

    // Convert file to Buffer to send to the vision model
    const imageBuffer = Buffer.from(await file.arrayBuffer());

    // 1. Call Gemma Vision model for OCR
    // IMPORTANT: Replace '<your-gemma-3n-vision-model-identifier>'
    // with the actual model identifier string for your Gemma vision model.
    // This could be something like '@cf/google/gemma-some-vision-variant' if on Cloudflare,
    // or a specific identifier if on another platform.
    const gemmaVisionModelIdentifier = 'gemma-3-12b-it';
    const gemmaModel = gemini(gemmaVisionModelIdentifier);

    let ocrTextFromGemma = '';

    try {
      const { text: gemmaResponseText } = await generateText({
        model: gemmaModel,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: '这里有一张答题卡，请你提取其中的文本，但是不要修复文本中的拼写/语法错误。如果有涂改导致单词错位的，你需要调整成正确的顺序。不需要markdown标记。最后，严格按照原文的分段将你的文本分成若干个自然段。特别注意，输出格式严格遵守以下JSON格式：{"result": "<OCR result>"}' },
              { type: 'image', image: imageBuffer, mimeType: file.type },
            ],
          },
        ],
        // maxTokens might be relevant for the Gemma model's output length
        // maxTokens: 2048, // Example, adjust as needed
      });
      ocrTextFromGemma = gemmaResponseText;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (gemmaError: any) {
      console.error('Gemma Vision API Error:', gemmaError);
      let errorMessage = 'Gemma Vision OCR及处理失败';
      if (gemmaError.data && gemmaError.data.error && gemmaError.data.error.message) {
        errorMessage = `Gemma Vision Error: ${gemmaError.data.error.message}`;
      } else if (gemmaError.message) {
        errorMessage = `Gemma Vision Error: ${gemmaError.message}`;
      }
      return NextResponse.json({
        success: false,
        error: errorMessage,
      }, { status: 500 });
    }

    if (!ocrTextFromGemma || ocrTextFromGemma.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'Gemma未能从图片中识别或提取到有效文本'
      }, { status: 422 });
    }

    // console.info("Text from Gemma Vision Model:", ocrTextFromGemma);
    // 解析 json 格式
    let parsedResult;
    // 鲁棒性处理，找到第一个{和最后一个}
    const startIndex = ocrTextFromGemma.indexOf('{');
    const endIndex = ocrTextFromGemma.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) {
      ocrTextFromGemma = ocrTextFromGemma.substring(startIndex, endIndex + 1);
    }
    // 尝试解析 JSON 格式的文本
    try {
      parsedResult = JSON.parse(ocrTextFromGemma);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      return NextResponse.json({
        success: false,
        error: 'Gemma返回的文本格式不正确'
      }, { status: 422 });
    }

    if (!parsedResult || !parsedResult.result) {
      return NextResponse.json({
        success: false,
        error: 'Gemma返回的文本格式不正确，缺少result字段'
      }, { status: 422 });
    }

    // Return the OCR text from Gemma
    return NextResponse.json({
      success: true,
      text: parsedResult.result.replaceAll('#', ''),
    });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Server Processing Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '服务器处理请求时出错'
    }, { status: 500 });
  }
}