import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { UIProvider }   from '@/contexts/UIContext';

export const metadata = {
  title: 'Hatantsetseg lash Beauty Salon — Tансаг Гоо Сайхны Үйлчилгээ',
  description: 'Hatantsetsey lash Beauty Salon — Lash, Brow Lami, Nail, Wax үйлчилгээг мэргэжлийн артисттай мэдрээрэй. Өнөөдөр цаг захиалаарай.',
  keywords: 'hatantsetsey lash, lash salon, brow lami, nail, wax, гоо сайхан, цаг захиалах, Улаанбаатар',
  authors: [{ name: 'Hatantsetsey lash Beauty Salon' }],
  openGraph: {
    type: 'website',
    url: 'https://salon-smoky-xi.vercel.app/',
    title: 'Hatantsetsey lash Beauty Salon',
    description: 'Lash, Brow Lami, Nail, Wax — мэргэжлийн артисттай цаг захиалж тансаг үйлчилгээг мэдрээрэй.',
    images: [{ url: 'https://salon-smoky-xi.vercel.app/og-image.png', width: 1200, height: 630 }],
    locale: 'mn_MN',
    siteName: 'Hatantsetsey lash Beauty Salon',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hatantsetsey lash Beauty Salon',
    description: 'Lash, Brow Lami, Nail, Wax — мэргэжлийн артисттай цаг захиалж тансаг үйлчилгээг мэдрээрэй.',
    images: ['https://salon-smoky-xi.vercel.app/og-image.png'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="mn">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💇</text></svg>" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body>
        <AuthProvider>
          <UIProvider>
            {children}
          </UIProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
