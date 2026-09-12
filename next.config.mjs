/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // 'unsafe-inline' is required by MUI's InitColorSchemeScript, which sets the
              // color-scheme attribute before hydration to avoid a dark/light flash (no nonce
              // plumbing available here); 'unsafe-eval' isn't needed at runtime and has been dropped.
              "script-src 'self' 'unsafe-inline' https://www.clarity.ms",
              "style-src 'self' 'unsafe-inline'",
              // unpkg.com: Globe3D's earth/topology textures. server.arcgisonline.com: Map's
              // light/dark basemap tiles (Esri's free, no-API-key basemap service).
              "img-src 'self' data: blob: https://unpkg.com https://server.arcgisonline.com",
              "font-src 'self'",
              "connect-src 'self' https://www.clarity.ms https://*.clarity.ms",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "worker-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
