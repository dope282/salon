/** @type {import('next').NextConfig} */
const nextConfig = {
  // Өөрийн сервер/cPanel дээр байршуулахад хөнгөн, бие даасан сервер үүсгэнэ (.next/standalone)
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'zbyibqszdwqngzpgsstn.supabase.co' },
    ],
  },
  experimental: {},
};

export default nextConfig;
