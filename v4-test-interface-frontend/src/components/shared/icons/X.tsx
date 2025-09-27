import { createIcon, IconProps } from './utils'

export const X = createIcon((props: IconProps) => (
  <svg viewBox="0 0 16 16" fill="none" {...props}>
    <path
      d="M12 4L4 12"
      stroke="currentColor"
      strokeWidth="1.33333"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4 4L12 12"
      stroke="currentColor"
      strokeWidth="1.33333"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
))
