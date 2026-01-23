import type { Metadata } from "next";
import "./globals.css";
import ScrollToTop from "@/components/ui/ScrollToTop";
import { ToastProvider } from "@/lib/toast";

export const metadata: Metadata = {
    title: "Suivi Partenariats | E=MC² Consulting",
    description: "Système de gestion et suivi des partenariats d'entreprise",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fr" suppressHydrationWarning>
            <body className="antialiased">
                <ToastProvider>
                    {/* Fixed background for all devices */}
                    <div
                        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
                        style={{ backgroundImage: 'url(/background.png)' }}
                    />
                    <div className="relative z-10 min-h-screen">
                        {children}
                    </div>
                    <ScrollToTop />
                </ToastProvider>
            </body>
        </html>
    );
}
