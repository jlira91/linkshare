import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ title: '', description: '', image: '' })

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LinkShare/1.0)' },
      signal: AbortSignal.timeout(5000),
    })
    const html = await res.text()

    const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1]
    const metaTitle = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]
    const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1]
    const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1]
    const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)?.[1]

    return NextResponse.json({
      title: ogTitle || metaTitle || '',
      description: ogDesc || metaDesc || '',
      image: ogImage || '',
    })
  } catch {
    return NextResponse.json({ title: '', description: '', image: '' })
  }
}
