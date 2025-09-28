import { createGlobalStyle } from 'styled-components'

export const GlobalStyle = createGlobalStyle`
  @font-face {
    font-family: 'Basel';
    src: url('https://static.uniswap.org/fonts/Basel-Book.woff2') format('woff2');
    font-weight: 400;
    font-style: normal;
  }

  @font-face {
    font-family: 'Basel';
    src: url('https://static.uniswap.org/fonts/Basel-Medium.woff2') format('woff2');
    font-weight: 500;
    font-style: normal;
  }

  * {
    box-sizing: border-box;
    user-select: auto;
    pointer-events: auto;
  }

  html {
    font-size: 16px;
    font-variant: none;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    font-feature-settings: 'ss01' on, 'ss02' on, 'cv01' on, 'cv03' on;
  }

  input, textarea {
    user-select: text;
    pointer-events: auto;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: 'Basel', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.neutral1};
    line-height: 1.3;
  }

  button {
    font-family: 'Basel', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-weight: 500;
  }

  h1, h2, h3, h4, h5, h6 {
    margin: 0;
    font-weight: 500;
  }
`
