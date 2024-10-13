'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { PaletteMode } from '@mui/material'

const ColorModeContext = createContext({ toggleColorMode: () => {} })

export function Providers({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>('light')

  const colorMode = {
    toggleColorMode: () => {
      setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'))
    },
  }

  const theme = createTheme({
    palette: {
      mode,
    },
  })

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as PaletteMode | null
    if (storedTheme) {
      setMode(storedTheme)
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