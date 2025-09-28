import 'styled-components'
import { Theme } from '../theme/theme'

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      neutral1: string
      neutral2: string
      neutral3: string
      accent1: string
      accent2: string
      accent3: string
      critical: string
      warning: string
      success: string
      background: string
      backgroundModule: string
      backgroundInteractive: string
      backgroundOutline: string
      backgroundScrim: string
      backgroundSurface: string
      backgroundBackdrop: string
      backgroundError: string
      backgroundSuccess: string
      borderColor: string
      accentAction: string
      accentActive: string
      accentSuccess: string
      accentWarning: string
      accentFailure: string
      accentCritical: string
      stateOverlayHover: string
      stateOverlayPressed: string
      networkDefaultShadow: string
      searchBackground: string
      searchOutline: string
    }
    fonts: {
      body: string
    }
    transition: {
      duration: {
        fast: string
        medium: string
        slow: string
      }
      timing: {
        ease: string
        in: string
        out: string
        inOut: string
      }
    }
  }
}
