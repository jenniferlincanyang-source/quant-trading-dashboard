import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "2026 A-Share Quant & Oracle Monitor",
  description: "量化交易监控仪表盘 — 三源交叉验证",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
