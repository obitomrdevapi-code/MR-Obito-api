import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url || !/^https?:\/\/.+/i.test(url)) {
    return NextResponse.json({ 
      success: false, 
      error: "يرجى تقديم رابط صالح عبر ?url=" 
    }, { status: 400 });
  }

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Content-Type': 'application/x-www-form-urlencoded'
  };

  const body = new URLSearchParams({
    'xjxfun': 'create',
    'xjxargs[]': `S<![CDATA[${url}]]>`
  });

  try {
    const response = await fetch('https://n9.cl/en', {
      method: 'POST',
      headers,
      body
    });

    if (!response.ok) {
      throw new Error(`فشل الطلب: ${response.status} ${response.statusText}`);
    }

    const responseText = await response.text();
    const match = responseText.match(/location = "(.+?)";/);
    const resultUrl = match?.[1];

    if (!resultUrl) {
      throw new Error("تعذر استخراج الرابط المختصر من الرد.");
    }

    const finalUrl = resultUrl.replace('/en/r', '');

    return NextResponse.json({
      success: true,
      original: url,
      shortened: finalUrl
    });

  } catch (err) {
    console.error("خطأ في اختصار الرابط:", err);
    return NextResponse.json({
      success: false,
      error: "حدث خطأ أثناء اختصار الرابط",
      details: err.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || !/^https?:\/\/.+/i.test(url)) {
      return NextResponse.json({ 
        success: false, 
        error: "يرجى تقديم رابط صالح في body" 
      }, { status: 400 });
    }

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    const bodyParams = new URLSearchParams({
      'xjxfun': 'create',
      'xjxargs[]': `S<![CDATA[${url}]]>`
    });

    const response = await fetch('https://n9.cl/en', {
      method: 'POST',
      headers,
      body: bodyParams
    });

    if (!response.ok) {
      throw new Error(`فشل الطلب: ${response.status} ${response.statusText}`);
    }

    const responseText = await response.text();
    const match = responseText.match(/location = "(.+?)";/);
    const resultUrl = match?.[1];

    if (!resultUrl) {
      throw new Error("تعذر استخراج الرابط المختصر من الرد.");
    }

    const finalUrl = resultUrl.replace('/en/r', '');

    return NextResponse.json({
      success: true,
      original: url,
      shortened: finalUrl
    });

  } catch (err) {
    console.error("خطأ في اختصار الرابط:", err);
    return NextResponse.json({
      success: false,
      error: "حدث خطأ أثناء اختصار الرابط",
      details: err.message
    }, { status: 500 });
  }
}
