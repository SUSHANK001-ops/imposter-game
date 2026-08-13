import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IMPOSTER — Real-Time Social Deduction Game",
  description: "Find the imposter among your friends! Real-time multiplayer secret word game with 1000+ words across 15+ categories.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-radial-glow antialiased selection:bg-purple-600 selection:text-white min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
