/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // WebP seul : bien plus rapide à générer que l'AVIF au premier affichage
    formats: ['image/webp'],
    // Pas de version 3840 px : 2560 suffit, même sur écran Retina
    deviceSizes: [640, 828, 1080, 1440, 1920, 2560],
    minimumCacheTTL: 2678400, // 31 jours en cache
  },
  // Démo du CRM (page autonome, données fictives) accessible sur /demo-crm
  async rewrites() {
    return [{ source: '/demo-crm', destination: '/demo-crm/index.html' }];
  },
  async headers() {
    return [{ source: '/demo-crm/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }];
  },
};

export default nextConfig;
