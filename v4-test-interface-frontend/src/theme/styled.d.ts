import 'styled-components'
import { Theme } from './theme'

declare module 'styled-components' {
  export interface DefaultTheme extends Theme {
    textPrimary: string;
    textSecondary: string;
    textDisabled: string;
    colors: {
      neutral1: string;
      neutral2: string;
      neutral3: string;
      accent1: string;
      accent2: string;
      accent3: string;
      critical: string;
      warning: string;
      success: string;
      background: string;
      backgroundModule: string;
      backgroundInteractive: string;
      backgroundOutline: string;
      backgroundScrim: string;
      backgroundSurface: string;
      backgroundBackdrop: string;
      backgroundError: string;
      backgroundSuccess: string;
      borderColor: string;
      accentAction: string;
      accentActive: string;
      accentSuccess: string;
      accentWarning: string;
      accentFailure: string;
      accentCritical: string;
      stateOverlayHover: string;
      stateOverlayPressed: string;
      networkDefaultShadow: string;
      searchBackground: string;
      searchOutline: string;
    };
    fontSizes: {
      small: string;
      medium: string;
      large: string;
      h1: string;
      h2: string;
      h3: string;
      h4: string;
      h5: string;
      h6: string;
    };
    fontWeights: {
      light: number;
      regular: number;
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
    opacities: {
      hover: number;
      pressed: number;
      disabled: number;
    };
    shadows: {
      small: string;
      medium: string;
      large: string;
    };
    radii: {
      small: string;
      medium: string;
      large: string;
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
    fonts: {
      body: string;
    };
    breakpoints: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
  }
}
