import { createGlobalStyle } from 'styled-components'
import { Theme } from './theme'

export const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    font-size: 16px;
    font-family: Inter, sans-serif;
    background-color: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.neutral1};
    overscroll-behavior: none;
  }

  button {
    user-select: none;
  }

  html {
    font-variant: none;
    font-smooth: always;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  }

  input:focus,
  textarea:focus,
  button:focus {
    outline: none;
  }

  /* Scrollbar styles */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.backgroundInteractive};
    border-radius: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.backgroundModule};
    border-radius: 8px;
  }
`
