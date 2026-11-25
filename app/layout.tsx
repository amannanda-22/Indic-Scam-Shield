import type { Metadata, Viewport } from "next";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import Backdrop from "@/components/Backdrop";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://indicscamshield.vercel.app"),
  title: { default: "Indic Scam Shield - agentic scam detection in Hinglish, Hindi & Telugu", template: "%s | Indic Scam Shield" },
  description:
    "Paste a suspicious SMS or WhatsApp message in Hinglish, Hindi or Telugu. An agent combines an ML classifier, URL forensics and safety-advisory retrieval to explain whether it is a scam - in plain words.",
  applicationName: "Indic Scam Shield",
  keywords: ["scam detection", "digital arrest", "UPI fraud", "Hinglish NLP", "Telugu NLP", "RAG", "AI agent", "India cyber fraud"],
  openGraph: {
    title: "Indic Scam Shield",
    description: "Agentic scam detection for the languages Indian scammers actually use.",
    type: "website",
    url: "https://indicscamshield.vercel.app",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#05070a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="noise min-h-screen">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-signal focus:px-4 focus:py-2 focus:text-black"
        >
          Skip to content
        </a>
        <Backdrop />
        <Nav />
        <main id="main" className="relative z-10">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
