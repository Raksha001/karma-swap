import React from 'react'
import { ThemeProvider as StyledComponentsThemeProvider } from 'styled-components'
import { darkTheme } from './index'
import { GlobalStyle } from './GlobalStyle'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <StyledComponentsThemeProvider theme={darkTheme}>
      <GlobalStyle />
      {children}
    </StyledComponentsThemeProvider>
  )
}
