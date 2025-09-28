import 'styled-components'
import { ThemeColors } from '@/theme/theme'

declare module 'styled-components' {
  export interface DefaultTheme extends ThemeColors {
    // Additional theme properties can be added here if needed
  }
}