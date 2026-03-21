import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { AuthSessionProvider } from "@/components/providers/session-provider"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
})
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
})

export const metadata: Metadata = {
  title: "NextJS Starter",
  description: "Next.js starter with Prisma, NeonDB, and email/password auth",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  )
}
