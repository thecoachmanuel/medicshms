import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Define your platform's main domains
  const platformDomains = [
    'medicshms.com',
    'localhost:3000',
    'www.medicshms.com',
    'medicshms.vercel.app'
  ];

  // 1. Skip if it's a platform domain or an internal Next.js request
  if (
    platformDomains.includes(hostname) ||
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.includes('.') // Skip files like favicon.ico, images, etc.
  ) {
    return NextResponse.next();
  }

  // 2. Custom Domain Resolution
  // We need to fetch the slug for this custom domain.
  // In a production app, you'd use a cache (like Vercel Edge Config or Redis).
  // For now, we'll fetch it from the Supabase API.
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.next();
    }

    // Call Supabase directly via REST to avoid heavy client initialization in middleware
    const response = await fetch(
      `${supabaseUrl}/rest/v1/hospitals?custom_domain=eq.${hostname}&select=slug`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );

    const data = await response.json();

    if (data && data.length > 0) {
      const slug = data[0].slug;
      
      // If we are at the root, rewrite to the hospital's landing page
      // e.g., hospital-a.com/ -> medicshms.com/hospital-a
      // If we are at /about, rewrite to /hospital-a/about
      
      return NextResponse.rewrite(new URL(`/${slug}${url.pathname}`, request.url));
    }
  } catch (error) {
    console.error('Middleware Domain Resolution Error:', error);
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
