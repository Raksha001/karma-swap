export const colors = {
  // Base colors
  white: '#FFFFFF',
  black: '#000000',
  
  // Additional colors
  gold400: '#F0B90B',
  green400: '#27AE60',

  // UI colors
  gray50: '#F5F6FC',
  gray100: '#E8ECFB',
  gray150: '#D2D9EE',
  gray200: '#B8C0DC',
  gray250: '#A6AFCA',
  gray300: '#98A1C0',
  gray350: '#888FAB',
  gray400: '#7780A0',
  gray450: '#6B7594',
  gray500: '#5D6785',
  gray550: '#505A78',
  gray600: '#404A67',
  gray650: '#333D59',
  gray700: '#293249',
  gray750: '#1B2236',
  gray800: '#131A2A',
  gray850: '#0E1524',
  gray900: '#0D111C',
  gray950: '#080B11',

  // Brand colors
  pink50: '#F9ECF1',
  pink100: '#FFD9E4',
  pink200: '#FBA4C0',
  pink300: '#FF6FA3',
  pink400: '#FB118E',
  pink500: '#C41969',
  pink600: '#8C0F49',
  pink700: '#55072A',
  pink800: '#350318',
  pink900: '#2B000B',
  pinkBase: '#FC74FE',
  pinkVibrant: '#F50DB4',

  // Action colors
  blue50: '#EDEFF8',
  blue100: '#DEE1FF',
  blue200: '#ADBCFF',
  blue300: '#869EFF',
  blue400: '#4C82FB',
  blue500: '#1966D2',
  blue600: '#0D4FA3',
  blue700: '#02367D',
  blue800: '#002051',
  blue900: '#00142C',
  blueVibrant: '#587BFF',

  // Surface colors
  surface1: '#131A2A',
  surface2: '#1B2236',
  surface3: '#293249',
  surface4: '#404A67',
  surface5: '#5D6785',

  // Additional colors
  red400: '#FA2B39',
  yellow100: '#FFE5C9',
  green200: '#5BF19C'
}

export const radii = {
  small: '4px',
  medium: '8px',
  large: '12px'
}

export const transitions = {
  duration: {
    fast: '125ms',
    medium: '250ms',
    slow: '500ms'
  },
  timing: {
    ease: 'ease',
    in: 'ease-in',
    out: 'ease-out',
    inOut: 'ease-in-out'
  }
}

export interface Theme {
  colors: {
    neutral1: string,
    neutral2: string,
    neutral3: string,
    accent1: string,
    accent2: string,
    accent3: string,
    critical: string,
    warning: string,
    success: string,
    background: string,
    backgroundModule: string,
    backgroundInteractive: string,
    backgroundOutline: string,
    backgroundScrim: string,
    backgroundSurface: string,
    backgroundBackdrop: string,
    backgroundError: string,
    backgroundSuccess: string,
    borderColor: string,
    accentAction: string,
    accentActive: string,
    accentSuccess: string,
    accentWarning: string,
    accentFailure: string,
    accentCritical: string,
    stateOverlayHover: string,
    stateOverlayPressed: string,
    networkDefaultShadow: string,
    searchBackground: string,
    searchOutline: string
  },
  textPrimary: string,
  textSecondary: string,
  textDisabled: string,
  radii: {
    small: string,
    medium: string,
    large: string
  },
  transition: {
    duration: {
      fast: string,
      medium: string,
      slow: string
    },
    timing: {
      ease: string,
      in: string,
      out: string,
      inOut: string
    }
  }
}

export const theme = {
  colors: {
    neutral1: colors.white,
    neutral2: colors.gray300,
    neutral3: colors.gray500,
    accent1: colors.blue400,
    accent2: colors.blue400,
    accent3: colors.blue400,
    critical: colors.red400,
    warning: colors.gold400,
    success: colors.green400,
    background: colors.gray950,
    backgroundModule: colors.gray900,
    backgroundInteractive: colors.gray800,
    backgroundOutline: colors.gray750,
    backgroundScrim: 'rgba(0, 0, 0, 0.6)',
    backgroundSurface: colors.gray900,
    backgroundBackdrop: 'rgba(0, 0, 0, 0.4)',
    backgroundError: 'rgba(214, 40, 40, 0.1)',
    backgroundSuccess: 'rgba(39, 174, 96, 0.1)',
    borderColor: colors.gray750,
    accentAction: colors.pink400,
    accentActive: colors.blue400,
    accentSuccess: colors.green400,
    accentWarning: colors.gold400,
    accentFailure: colors.red400,
    accentCritical: colors.red400,
    stateOverlayHover: 'rgba(255, 255, 255, 0.08)',
    stateOverlayPressed: 'rgba(255, 255, 255, 0.12)',
    networkDefaultShadow: 'rgba(0, 0, 0, 0.24)',
    searchBackground: colors.gray800,
    searchOutline: colors.gray700,
  },
  textPrimary: colors.white,
  textSecondary: colors.gray300,
  textDisabled: colors.gray600,
  fontSizes: {
    small: '12px',
    medium: '14px',
    large: '16px',
    h1: '32px',
    h2: '24px',
    h3: '20px',
    h4: '18px',
    h5: '16px',
    h6: '14px',
  },
  fontWeights: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px',
    round: '9999px',
  },
  opacities: {
    hover: 0.8,
    pressed: 0.6,
    disabled: 0.4,
  },
  shadows: {
    small: '0 2px 4px rgba(0, 0, 0, 0.1)',
    medium: '0 4px 8px rgba(0, 0, 0, 0.1)',
    large: '0 8px 16px rgba(0, 0, 0, 0.1)',
  },
  radii,
  transition: transitions,
  fonts: {
    body: 'Inter, sans-serif',
  },
  breakpoints: {
    xs: '0px',
    sm: '600px',
    md: '960px',
    lg: '1280px',
    xl: '1920px',
  },
}