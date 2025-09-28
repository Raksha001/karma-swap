import { DefaultTheme } from 'styled-components'

// This utility function helps with type-safe theme access
export const getThemeValue = (theme: DefaultTheme, path: string) => {
  const parts = path.split('.')
  let value: any = theme
  
  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part]
    } else {
      console.warn(`Theme path not found: ${path}`)
      return undefined
    }
  }
  
  return value
}

// Specific getters for common theme properties
export const getColor = (theme: DefaultTheme, colorKey: string) => {
  // Use type assertion to safely access the color
  return (theme.colors as Record<string, string>)[colorKey] || ''
}

export const getSurface = (theme: DefaultTheme, level: 1 | 2 | 3 | 4 | 5) => {
  const key = `surface${level}`
  // Use type assertion to safely access the surface color
  return (theme.colors as Record<string, string>)[key] || ''
}

export const getAccent = (theme: DefaultTheme, key: 'accent1' | 'accent2' | 'accent3' | 'accent1Hover') => {
  // Use type assertion to safely access the accent color
  return (theme.colors as Record<string, string>)[key] || ''
}

export const getNeutral = (theme: DefaultTheme, level: 1 | 2 | 3) => {
  const key = `neutral${level}`
  // Use type assertion to safely access the neutral color
  return (theme.colors as Record<string, string>)[key] || ''
}
