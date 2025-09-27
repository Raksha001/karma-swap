import React from 'react'
import { createIcon, IconProps } from './utils'

export const Chevron = createIcon((props: IconProps) => (
  <svg viewBox="0 0 16 16" fill="none" {...props}>
    <path
      d="M4 6L8 10L12 6"
      stroke="currentColor"
      strokeWidth="1.33333"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
))
