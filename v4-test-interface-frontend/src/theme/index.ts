import 'styled-components';

// Extend the default theme
declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      background: string;
      backgroundModule: string;
      backgroundInteractive: string;
      backgroundOutline: string;
      accentAction: string;
      accentActive: string;
      accentSuccess: string;
      accentWarning: string;
      accentFailure: string;
      accentCritical: string;
      neutral1: string;
      neutral2: string;
      neutral3: string;
      textPrimary: string;
      textSecondary: string;
      textTertiary: string;
    };
    shadows: {
      elevation: string;
    };
    opacities: {
      hover: number;
      click: number;
      disabled: number;
      enabled: number;
    };
    fonts: {
      body: string;
      heading: string;
      code: string;
    };
    fontSizes: {
      micro: string;
      small: string;
      medium: string;
      large: string;
      h3: string;
      h2: string;
      h1: string;
    };
    fontWeights: {
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
    borderRadius: {
      small: string;
      medium: string;
      large: string;
      round: string;
    };
    breakpoints: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
    };
    transition: {
      duration: {
        fast: string;
        medium: string;
        slow: string;
      };
      timing: {
        ease: string;
        in: string;
        out: string;
        inOut: string;
      };
    };
  }
}

// Theme based on Uniswap interface theme
export const darkTheme = {
  colors: {
    background: '#131313',
    backgroundModule: '#191919',
    backgroundInteractive: '#303030',
    backgroundOutline: '#404040',
    accentAction: '#FC72FF', // Uniswap pink
    accentActive: '#9B4CFF',
    accentSuccess: '#27AE60',
    accentWarning: '#F3841E',
    accentFailure: '#FD4040',
    accentCritical: '#FF0000',
    neutral1: '#FFFFFF',
    neutral2: '#C3C5CB',
    neutral3: '#8F96AC',
    textPrimary: '#FFFFFF',
    textSecondary: '#C3C5CB',
    textTertiary: '#8F96AC',
  },
  shadows: {
    elevation: '0px 4px 16px rgba(0, 0, 0, 0.12)',
  },
  opacities: {
    hover: 0.6,
    click: 0.4,
    disabled: 0.5,
    enabled: 1,
  },
  fonts: {
    body: 'Inter, sans-serif',
    heading: 'Inter, sans-serif',
    code: 'monospace',
  },
  fontSizes: {
    micro: '10px',
    small: '12px',
    medium: '14px',
    large: '16px',
    h3: '20px',
    h2: '24px',
    h1: '36px',
  },
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px',
    round: '999px',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    xxl: '1536px',
  },
  transition: {
    duration: {
      fast: '125ms',
      medium: '250ms',
      slow: '500ms',
    },
    timing: {
      ease: 'ease',
      in: 'ease-in',
      out: 'ease-out',
      inOut: 'ease-in-out',
    },
  },
}

export type Theme = typeof darkTheme
