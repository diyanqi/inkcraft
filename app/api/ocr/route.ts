import { NextRequest } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

const openai = createOpenAI({
  baseURL: process.env.OPENAI_API_BASEURL || '',
  apiKey: process.env.OPENAI_API_APIKEY || '',
  compatibility: 'compatible',
});

// 从环境变量获取API密钥数组
const getApiKeys = () => {
  const apiKeysString = process.env.OCR_API_KEYS || '';
  return apiKeysString.split(',').filter(key => key.trim() !== '');
};

// 简单的轮询算法，每次请求使用不同的API密钥
let currentKeyIndex = 0;
const getNextApiKey = () => {
  const apiKeys = getApiKeys();
  if (apiKeys.length === 0) {
    throw new Error('未配置OCR API密钥');
  }
  
  const key = apiKeys[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
  return key;
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(JSON.stringify({ error: '未提供图片文件' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

   // Add server-side file size check (e.g., 1MB)
   const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB in bytes
   if (file.size > MAX_FILE_SIZE) {
     return new Response(JSON.stringify({ success: false, error: '图片文件过大，请确保小于1MB' }), {
       status: 413, // Payload Too Large
       headers: { 'Content-Type': 'application/json' }
     });
   }

    // 创建新的FormData对象发送到OCR服务
    const ocrFormData = new FormData();
    ocrFormData.append('file', file);
    ocrFormData.append('apikey', getNextApiKey());
    ocrFormData.append('language', 'eng');
    ocrFormData.append('isOverlayRequired', 'false');
    ocrFormData.append('OCREngine', '2');
    ocrFormData.append('detectOrientation', 'true');

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: ocrFormData
    });

    const data = await response.json();
    
    if (data.ParsedResults && data.ParsedResults.length > 0) {
      const parsedText = data.ParsedResults[0].ParsedText;
      const cleanedText = parsedText;

      // console.info(cleanedText);
      
      // return Response.json({
      //   success: true,
      //   text: cleanedText
      // });

      const model = openai('@cf/meta/llama-3.1-8b-instruct-fast');
      const { text } = await generateText({
        model,
        messages: [
          {
            role: 'system',
            content: `The user will provide you with an OCR text from an answer sheet or a paper, which may contain garbled characters, recognition errors, extra characters, and irrelevant information from the answer sheet or the paper itself. You need to analyze its content, correct it, and extract the accurate text, then output it directly, without any additional information or explanation like 'Here is the corrected and extracted text'.`,
          },
          {
            role: 'user',
            content: cleanedText,
          },
        ],
        maxTokens: 3096,
      });
      // console.info(text);
      return Response.json({
        success: true,
        text,
      });
    } else {
      return Response.json({
        success: false,
        error: data.ErrorMessage || 'OCR识别失败'
      }, { status: 422 });
    }
  } catch (error) {
    console.error('OCR API Error:', error);
    return Response.json({
      success: false,
      error: '服务器处理OCR请求时出错'
    }, { status: 500 });
  }
}