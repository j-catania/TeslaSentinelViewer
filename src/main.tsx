import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import App from './App'
import './index.scss'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#e31937' },
    background: { default: '#0d0d0d', paper: '#1a1a1a' },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiCard: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
  },
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)

postMessage({ payload: 'removeLoading' }, '*')
