import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Navbar } from '@/components/layout/Navbar';
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'BlogSpace — Modern Blog Platform',
    template: '%s | BlogSpace',
  },
  description: 'A modern, minimalist blog platform for writers and readers.',
  keywords: ['blog', 'writing', 'articles', 'stories'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'BlogSpace',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <Providers>
          <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-border py-8 mt-16">
              <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
                <p>© {new Date().getFullYear()} BlogSpace. Built with Next.js & Express.</p>
              </div>
            </footer>
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: '12px',
                fontSize: '14px',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
