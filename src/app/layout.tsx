import { Providers } from './providers'
import { MicrosoftClarity } from './MicrosoftClarity'

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head />
            <body>
                <Providers>{children}</Providers>
                <MicrosoftClarity />
            </body>
        </html>
    )
}