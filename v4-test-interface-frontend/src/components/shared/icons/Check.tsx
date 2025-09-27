import React from 'react'
import { createIcon, IconProps } from './utils'

export const Check = createIcon((props: IconProps) => (
  <svg viewBox="0 0 16 16" fill="none" {...props}>
    <path
      d="M13.3333 4L6 11.3333L2.66667 8"
      stroke="currentColor"
      strokeWidth="1.33333"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
))
