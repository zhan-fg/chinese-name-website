import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { chartId } = await request.json();
    if (!chartId) {
      return NextResponse.json({ error: 'Missing chartId' }, { status: 400 });
    }

    const productUrl = process.env.NEXT_PUBLIC_GUMROAD_URL || 'https://zhanqiuhui.gumroad.com/l/pyzrg';
    const checkoutUrl = new URL(productUrl);
    checkoutUrl.searchParams.set('wanted', 'true');

    return NextResponse.json({ url: checkoutUrl.toString() });
  } catch (err: any) {
    console.error('[checkout] error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
