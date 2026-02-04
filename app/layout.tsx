import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'G-Access - Gemini Proxy',
  description: 'Minimal Gemini API Proxy',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 20, fontFamily: 'system-ui' }}>
        {children}
      </body>
    </html>
  )
}
