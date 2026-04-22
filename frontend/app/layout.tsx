import { Providers } from './providers'
import './globals.css'

export const metadata = {
  title: 'Omen — Autonomous Prediction Markets',
  description: 'Prediction markets for on-chain events, resolved by AI and chain state.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
