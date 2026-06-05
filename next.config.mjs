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
  // Хуваалцсан хостингийн процессын хязгаарт (EAGAIN) тулгаралгүй build хийх — ажилчин процессыг 1 болгох
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
};

export default nextConfig;
