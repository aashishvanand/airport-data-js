'use client'
import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { PaletteMode } from '@mui/material'
import getDesignTokens from '../theme/theme'

const ColorModeContext = createContext({ toggleColorMode: () => { } })

export function Providers({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>('light')

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'))
      },
    }),
    [],
  );

  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  useEffect(() => {
    // Check system preference or local storage
    const storedTheme = localStorage.getItem('theme') as PaletteMode | null
    if (storedTheme) {
      setMode(storedTheme)
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setMode('dark')
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('theme', mode)
  }, [mode])

  return (
    <ColorModeContext.Provider value={colorMode}>
      <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
        <MuiThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </MuiThemeProvider>
      </NextThemesProvider>
    </ColorModeContext.Provider>
  )
}

export const useColorMode = () => useContext(ColorModeContext)