import {
  Geist,
  Geist_Mono,
  Noto_Sans_JP,
  Noto_Sans_SC,
} from "next/font/google";
import localFont from "next/font/local";
import "./globals.scss";
import AppShell from "../components/AppShell.client";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = localFont({
  variable: "--font-cormorant",
  src: [
    {
      path: "../../public/Fonts/CormorantGaramond-VariableFont_wght.ttf",
      style: "normal",
      weight: "300 700",
    },
    {
      path: "../../public/Fonts/CormorantGaramond-Italic-VariableFont_wght.ttf",
      style: "italic",
      weight: "300 700",
    },
  ],
  display: "swap",
});

const notoJp = Noto_Sans_JP({
  variable: "--font-noto-jp",
  subsets: ["japanese"],
  weight: ["300", "400", "500", "600", "700"],
});

const notoSc = Noto_Sans_SC({
  variable: "--font-noto-sc",
  subsets: ["chinese-simplified"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title:
    "CTRL.moscow — студия разработки интерактивных музейных инсталляций и мультимедийных экспозиций",
  description:
    "Создаём интерактивные стенды, цифровые экспозиции, иммерсивные пространства, мультимедийный контент, 3D-графику, видео и программные решения для музеев, выставок, форумов и общественных пространств.",
  keywords: [
    "выставки",
    "музеи",
    "интерактивные инсталляции",
    "музейный контент",
    "мультимедиа",
    "экспозиции",
    "video mapping",
    "immersive experiences",
  ],
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <head>
        <meta name="apple-mobile-web-app-title" content="ctrl." />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} ${notoJp.variable} ${notoSc.variable}`}
        data-header-state="hero"
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
