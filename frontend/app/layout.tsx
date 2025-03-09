import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import WalletContextProvider from "./contexts/WalletContextProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "AI NFT Platform",
    description: "Mint, own, and interact with unique AI characters on the Solana blockchain",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
            </head>
            <body className={`${inter.className} min-h-screen bg-black text-white antialiased`} suppressHydrationWarning>
                <WalletContextProvider>
                    {children}
                </WalletContextProvider>
            </body>
        </html>
    );
} 