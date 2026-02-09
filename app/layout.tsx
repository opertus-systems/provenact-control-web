import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { Footer } from "../components/footer";
import { GoogleAnalytics } from "../components/google-analytics";
import { Header } from "../components/header";

import "./globals.css";
import "swagger-ui-react/swagger-ui.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display"
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono"
});

export const metadata: Metadata = {
  title: "Provenact Platform | Open-Source Agent Infrastructure",
  description:
    "Provenact Platform includes Control, Core Provenact, SDK tooling, and base skills for governed, auditable agent execution."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${plexMono.variable}`}>
      <body>
        {measurementId ? <GoogleAnalytics measurementId={measurementId} /> : null}
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
