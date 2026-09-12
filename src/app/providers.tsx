'use client'
import { ThemeProvider as MuiThemeProvider, useColorScheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import theme from '../theme/theme'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MuiThemeProvider theme={theme} defaultMode="system">
      <CssBaseline enableColorScheme />
      {children}
    </MuiThemeProvider>
  )
}

// Thin wrapper over MUI's own color-scheme hook, kept so callers don't need to know
// the mode is 'system' | 'light' | 'dark' under the hood — toggleColorMode just flips
// between light and dark regardless of which one 'system' currently resolves to.
export function useColorMode() {
  const { mode, systemMode, setMode } = useColorScheme()
  const resolvedMode = mode === 'system' ? systemMode : mode
  return {
    mode: resolvedMode,
    toggleColorMode: () => setMode(resolvedMode === 'dark' ? 'light' : 'dark'),
  }
}
