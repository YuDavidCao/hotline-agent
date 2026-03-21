import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { AuthSessionProvider } from "@/components/providers/session-provider"
import { Figtree } from "next/font/google";
import { cn } from "@/lib/utils";

const figtree = Figtree({subsets:['latin'],variable:'--font-sans'});

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
  title: {
    default: "Hotline Agent",
    template: "%s | Hotline Agent",
  },
  description:
    "Analyze phone conversations between humans and LLM agents with structured transcripts. Not intended for HIPAA-covered healthcare or PHI.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={cn("font-sans", figtree.variable)}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-slate-50 text-slate-900`}
      >
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  )
}
