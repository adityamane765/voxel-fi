import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import PrivyProvider from '@/providers/PrivyProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'VoxelFi - Private Fractal Liquidity',
  description:
    'Privacy-first liquidity provisioning protocol on Movement Network. ZK-powered fractal liquidity positions.',
  keywords: [
    'DeFi',
    'Liquidity',
    'ZK',
    'Zero Knowledge',
    'Movement Network',
    'Fractal',
    'Privacy',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white min-h-screen`}
      >
        <PrivyProvider>{children}</PrivyProvider>
      </body>
    </html>
  );
}
