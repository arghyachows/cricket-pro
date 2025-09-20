import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Cricket Manager Pro - Professional Cricket Management Game',
  description: 'Professional cricket management game where you control your own cricket club, manage players, and compete in matches',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
