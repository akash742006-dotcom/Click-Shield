import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Click Shield — Check before you click. Understand before you trust.",
  description:
    "AI-powered link security & privacy intelligence. Detect phishing, smishing and scams before you click — and understand what an app does with your data before you trust it.",
  keywords: [
    "Click Shield",
    "phishing detection",
    "smishing",
    "link scanner",
    "privacy policy analyzer",
    "verified link rescue",
    "cybersecurity",
  ],
  authors: [{ name: "Click Shield" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Click Shield — AI-Powered Link Security & Privacy Intelligence",
    description:
      "Check before you click. Understand before you trust. Find the real website when a link looks suspicious.",
    siteName: "Click Shield",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
