import type { Metadata } from "next";
import {
  Anton,
  Bangers,
  Bebas_Neue,
  Caveat,
  Cormorant_Garamond,
  Dancing_Script,
  Geist,
  Geist_Mono,
  Great_Vibes,
  Inter,
  Lato,
  League_Spartan,
  Libre_Baskerville,
  Lobster,
  Montserrat,
  Nunito,
  Oswald,
  Pacifico,
  Permanent_Marker,
  Playfair_Display,
  Poppins,
  Raleway,
} from "next/font/google";

import "./globals.css";
import { cn } from "@/lib/utils";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

/*
  This remains Gripix's normal website font.
  Keeping --font-sans restores the previous layout appearance.
*/
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-poppins",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-lato",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
});

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas-neue",
});

const leagueSpartan = League_Spartan({
  subsets: ["latin"],
  variable: "--font-league-spartan",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cormorant-garamond",
});

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-libre-baskerville",
});

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pacifico",
});

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing-script",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
});

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-great-vibes",
});

const lobster = Lobster({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-lobster",
});

const permanentMarker = Permanent_Marker({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-permanent-marker",
});

const bangers = Bangers({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bangers",
});

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Gripix",
  description: "Create, customise and export beautiful designs with Gripix.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        "font-sans",
        inter.variable,
        geistSans.variable,
        geistMono.variable,

        // These are available only when selected inside the editor.
        poppins.variable,
        montserrat.variable,
        lato.variable,
        nunito.variable,
        raleway.variable,
        oswald.variable,
        anton.variable,
        bebasNeue.variable,
        leagueSpartan.variable,
        playfairDisplay.variable,
        cormorantGaramond.variable,
        libreBaskerville.variable,
        pacifico.variable,
        dancingScript.variable,
        caveat.variable,
        greatVibes.variable,
        lobster.variable,
        permanentMarker.variable,
        bangers.variable
      )}
    >
      <body className="flex min-h-full flex-col">
        {children}
      </body>
    </html>
  );
}
