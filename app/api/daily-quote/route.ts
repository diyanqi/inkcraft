let cachedQuote: any = null;
let cachedAt: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1小时，单位为毫秒

export async function GET() {
  const now = Date.now();
  if (cachedQuote && (now - cachedAt < CACHE_DURATION)) {
    // 命中缓存，直接返回
    return Response.json(cachedQuote);
  }

  try {
    const response = await fetch('https://apiv3.shanbay.com/weapps/dailyquote/quote', {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch quote');
    }

    const data = await response.json();
    // 更新缓存
    cachedQuote = data;
    cachedAt = now;
    return Response.json(data);
  } catch (error) {
    return new Response('Failed to fetch quote', { status: 500 });
  }
}