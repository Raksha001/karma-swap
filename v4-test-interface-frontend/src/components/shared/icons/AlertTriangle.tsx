import React from 'react'
import { createIcon, IconProps } from './utils'

export const AlertTriangle = createIcon((props: IconProps) => (
  <svg viewBox="0 0 16 16" fill="none" {...props}>
    <path
      d="M6.86001 2.57335L1.21335 12C1.09693 12.2016 1.03533 12.4302 1.03467 12.663C1.03402 12.8958 1.09434 13.1248 1.20963 13.3272C1.32492 13.5296 1.49116 13.6978 1.69229 13.8155C1.89342 13.9331 2.12284 13.9961 2.35602 13.9982H13.6454C13.8786 13.9961 14.108 13.9331 14.3091 13.8155C14.5102 13.6978 14.6765 13.5296 14.7918 13.3272C14.9071 13.1248 14.9674 12.8958 14.9667 12.663C14.9661 12.4302 14.9045 12.2016 14.788 12L9.14135 2.57335C9.02316 2.37742 8.85654 2.21543 8.65667 2.10313C8.4568 1.99082 8.23032 1.93237 8.00068 1.93237C7.77104 1.93237 7.54455 1.99082 7.34468 2.10313C7.14481 2.21543 6.97819 2.37742 6.86001 2.57335Z"
      stroke="currentColor"
      strokeWidth="1.33333"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 6V8.66667"
      stroke="currentColor"
      strokeWidth="1.33333"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 11.3334H8.00667"
      stroke="currentColor"
      strokeWidth="1.33333"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
))
