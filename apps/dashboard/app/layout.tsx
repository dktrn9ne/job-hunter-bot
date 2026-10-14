import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CheckChaser | Evidence-based ATS workspace",
  description: "Private ATS analysis and resume tailoring workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
