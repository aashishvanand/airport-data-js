'use client';

import { createTheme, alpha } from '@mui/material/styles';

// Premium Color Palettes
const lightPalette = {
    primary: {
        main: '#2563eb', // Vibrant Blue
        light: '#60a5fa',
        dark: '#1e40af',
        contrastText: '#ffffff',
    },
    secondary: {
        main: '#7c3aed', // Deep Purple
        light: '#a78bfa',
        dark: '#5b21b6',
        contrastText: '#ffffff',
    },
    background: {
        default: '#f8fafc', // Slate 50
        paper: '#ffffff',
    },
    text: {
        primary: '#0f172a', // Slate 900
        secondary: '#475569', // Slate 600
    },
    action: {
        hover: alpha('#2563eb', 0.04),
        selected: alpha('#2563eb', 0.08),
    },
};

const darkPalette = {
    primary: {
        main: '#3b82f6', // Bright Blue
        light: '#60a5fa',
        dark: '#1d4ed8',
        contrastText: '#ffffff',
    },
    secondary: {
        main: '#8b5cf6', // Bright Purple
        light: '#a78bfa',
        dark: '#7c3aed',
        contrastText: '#ffffff',
    },
    background: {
        default: '#0f172a', // Slate 900
        paper: '#1e293b', // Slate 800
    },
    text: {
        primary: '#f8fafc', // Slate 50
        secondary: '#cbd5e1', // Slate 300
    },
    action: {
        hover: alpha('#3b82f6', 0.08),
        selected: alpha('#3b82f6', 0.12),
    },
};

// A single theme instance serves both color schemes via CSS variables — the browser
// switches which set of variables applies (through the data-mui-color-scheme attribute)
// with no JS re-render and no light-frame flash before hydration, unlike the previous
// approach of building a separate theme per `mode` in React state.
const theme = createTheme({
    cssVariables: {
        colorSchemeSelector: 'data-mui-color-scheme',
    },
    colorSchemes: {
        light: { palette: lightPalette },
        dark: { palette: darkPalette },
    },
    typography: {
        fontFamily: 'var(--font-inter), "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontWeight: 800, letterSpacing: '-0.02em' },
        h2: { fontWeight: 700, letterSpacing: '-0.01em' },
        h3: { fontWeight: 700, letterSpacing: '-0.01em' },
        h4: { fontWeight: 600 },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
        subtitle1: { fontWeight: 500, lineHeight: 1.5 },
        button: { fontWeight: 600, textTransform: 'none' },
    },
    shape: {
        borderRadius: 16,
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: (theme) => ({
                body: {
                    scrollbarColor: '#cbd5e1 #f1f5f9',
                    ...theme.applyStyles('dark', {
                        scrollbarColor: '#334155 #0f172a',
                    }),
                    '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
                        backgroundColor: 'transparent',
                        width: '8px',
                        height: '8px',
                    },
                    '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
                        borderRadius: 8,
                        backgroundColor: '#cbd5e1',
                        minHeight: 24,
                        border: '2px solid #f1f5f9',
                        ...theme.applyStyles('dark', {
                            backgroundColor: '#334155',
                            border: '2px solid #0f172a',
                        }),
                    },
                },
            }),
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    padding: '10px 24px',
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0 4px 12px 0 rgba(0,0,0,0.1)',
                        transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.2s ease-in-out',
                },
                contained: {
                    boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
                }
            },
        },
        MuiCard: {
            styleOverrides: {
                root: (({ theme }) => ({
                    borderRadius: 20,
                    backgroundImage: 'none',
                    backdropFilter: 'blur(12px)',
                    border: `1px solid ${alpha('#000', 0.04)}`,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                    ...theme.applyStyles('dark', {
                        border: `1px solid ${alpha('#fff', 0.08)}`,
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
                    }),
                })) as any,
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                }
            }
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 500,
                },
                filled: {
                    border: '1px solid transparent',
                },
                outlined: {
                    borderWidth: '1px',
                }
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: (({ theme }) => ({
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 12,
                        transition: 'all 0.2s',
                        '&.Mui-focused': {
                            boxShadow: `0 0 0 2px ${alpha('#2563eb', 0.2)}`,
                            ...theme.applyStyles('dark', {
                                boxShadow: `0 0 0 2px ${alpha('#3b82f6', 0.2)}`,
                            }),
                        }
                    },
                })) as any,
            },
        },
    },
});

export default theme;
