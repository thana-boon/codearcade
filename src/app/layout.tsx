import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Code Arcade",
  description: "เกมฝึกฝนทักษะการเขียนโค้ดแบบสนุก ๆ เริ่มที่ Bug Hunt",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-bg text-[#e6edf3] antialiased">
        {children}
      </body>
    </html>
  );
}
