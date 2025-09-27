import React from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from './ThemeProvider'
import { GlobalStyle } from './theme/GlobalStyle'
import { App } from './App'

const root = createRoot(document.getElementById('root') as HTMLElement)

root.render(
  <React.StrictMode>
    <ThemeProvider>
      <GlobalStyle />
      <App />
    </ThemeProvider>
  </React.StrictMode>
)