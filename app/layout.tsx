import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DEPL Textiles – Enterprise Business Intelligence Dashboard',
  description: 'Single-Page Professional Textile ERP Sales & Operations Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F2F3F3] text-[#263238] antialiased">
        {children}
      </body>
    </html>
  );
}
