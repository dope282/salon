/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'zbyibqszdwqngzpgsstn.supabase.co' },
    ],
  },
  async redirects() {
    return [
      { source: '/favicon.ico', destination: '/logo.jpg', permanent: false },
    ];
  },
  experimental: {},
};

export default nextConfig;
