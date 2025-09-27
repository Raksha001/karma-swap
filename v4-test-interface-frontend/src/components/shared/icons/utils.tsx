import React from 'react'

export type IconProps = React.SVGProps<SVGSVGElement> & {
  width?: number
  height?: number
  color?: string
}

export const createIcon = (
  getIcon: (props: IconProps) => JSX.Element,
  defaultProps: Partial<IconProps> = {}
): React.FC<IconProps> => {
  const Icon: React.FC<IconProps> = (props) => {
    return getIcon({
      width: 24,
      height: 24,
      ...defaultProps,
      ...props,
    })
  }
  
  return Icon
}
