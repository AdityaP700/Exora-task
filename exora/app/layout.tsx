import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Providers } from "@/components/providers";
import "./globals.css"

export const metadata: Metadata = {
  title: "Exora Analytics Dashboard",
  description: "Comprehensive analytics dashboard for actionable insights",
  generator: "v0.app",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <div className="min-h-screen w-full bg-black relative">
          {/* Background */}
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, rgba(58, 123, 255, 0.15) 0%, rgba(123, 104, 238, 0.07) 35%, transparent 50%)`,
            }}
          />
          {/* Content wrapped in Providers so global client features (ApiKeyModal) mount */}
          <div className="relative z-10">
            <Providers>
              {children}
            </Providers>
          </div>
        </div>
        <Analytics />
      </body>
    </html>
  );
}