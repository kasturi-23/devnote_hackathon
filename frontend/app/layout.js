import { Fraunces, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-title",
  subsets: ["latin"],
});

export const metadata = {
  title: "DevNote Event Matcher",
  description: "User event selection and recommendation matching demo",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${fraunces.variable}`}>
      <body>{children}</body>
    </html>
  );
}
