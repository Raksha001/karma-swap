import React from 'react'

export const RotateLeft: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M7.33333 2.66667V1L4.66667 3.66667L7.33333 6.33333V4.66667C9.54467 4.66667 11.3333 6.45533 11.3333 8.66667C11.3333 10.878 9.54467 12.6667 7.33333 12.6667C5.122 12.6667 3.33333 10.878 3.33333 8.66667H2C2 11.6133 4.38667 14 7.33333 14C10.28 14 12.6667 11.6133 12.6667 8.66667C12.6667 5.72 10.28 3.33333 7.33333 3.33333V2.66667Z"
        fill="currentColor"
      />
    </svg>
  )
}
