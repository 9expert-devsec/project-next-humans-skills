import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export default function RootLayout({ children }) {
  return (
    <html
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

export const metadata = {
  title: 'The Next Humans Skills - สร้างทักษะให้เป็นบุคลากรในโลกยุคใหม่',
  description: 'the next humans skills platform for training registration.',
  icons: {
    icon: '/icon.png', // ไฟล์ต้องอยู่ในโฟลเดอร์ public
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
};