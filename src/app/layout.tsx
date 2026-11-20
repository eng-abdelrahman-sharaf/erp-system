import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { NavigationProvider } from "@/components/providers/NavigationProvider";
import { NavigationProgressBar } from "@/components/shared/NavigationProgressBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ERP System",
  description: "An ERP system to manage employees, orders, warehouses, inventory and more",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full overflow-hidden antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NavigationProvider>
          <NavigationProgressBar />
          {children}
        </NavigationProvider>
        <Toaster />
      </body>
    </html>
  );
}
