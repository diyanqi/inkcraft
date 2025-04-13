export async function GET() {
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
    return Response.json(data);
  } catch (error) {
    return new Response('Failed to fetch quote', { status: 500 });
  }
}