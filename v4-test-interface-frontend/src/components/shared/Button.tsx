import React from 'react'
import styled from 'styled-components'
import { theme } from '../../theme/theme'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'critical'
  emphasis?: 'primary' | 'secondary' | 'tertiary'
  size?: 'small' | 'medium' | 'large'
  isDisabled?: boolean
  fullWidth?: boolean
  icon?: React.ReactNode
  onPress?: () => void
}

const getBackgroundColor = (props: StyledButtonProps) => {
  if (props.isDisabled) return props.theme.colors.backgroundInteractive
  
  if (props.emphasis === 'tertiary') return 'transparent'
  
  switch (props.variant) {
    case 'primary':
      return props.theme.colors.accentAction
    case 'secondary':
      return props.theme.colors.backgroundInteractive
    case 'outline':
      return 'transparent'
    case 'critical':
      return props.theme.colors.accentCritical
    default:
      return props.theme.colors.accentAction
  }
}

const getColor = (props: StyledButtonProps) => {
  if (props.isDisabled) return props.theme.colors.neutral3
  
  if (props.emphasis === 'tertiary') return props.theme.colors.neutral2
  
  switch (props.variant) {
    case 'primary':
      return props.theme.colors.neutral1
    case 'secondary':
      return props.theme.colors.neutral1
    case 'outline':
      return props.theme.colors.neutral1
    case 'critical':
      return props.theme.colors.neutral1
    default:
      return props.theme.colors.neutral1
  }
}

const getBorder = (props: StyledButtonProps) => {
  if (props.emphasis === 'tertiary') return 'none'
  
  switch (props.variant) {
    case 'outline':
      return `1px solid ${props.theme.colors.backgroundOutline}`
    default:
      return 'none'
  }
}

const getPadding = (props: StyledButtonProps) => {
  switch (props.size) {
    case 'small':
      return '6px 12px'
    case 'large':
      return '12px 20px'
    default:
      return '10px 16px'
  }
}

interface StyledButtonProps extends ButtonProps {
  $isDisabled?: boolean
}

const StyledButton = styled.button<StyledButtonProps>`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: ${getPadding};
  border: ${getBorder};
  border-radius: ${({ theme }) => theme.radii.medium};
  background: ${getBackgroundColor};
  color: ${getColor};
  font-size: 16px;
  font-weight: 500;
  width: ${({ fullWidth }) => (fullWidth ? '100%' : 'auto')};
  cursor: ${({ isDisabled }) => (isDisabled ? 'not-allowed' : 'pointer')};
  transition: all 125ms ease;
  user-select: none;

  &:hover {
    background: ${props => {
      if (props.isDisabled) return props.theme.colors.backgroundInteractive
      
      if (props.emphasis === 'tertiary') return props.theme.colors.stateOverlayHover
      
      switch (props.variant) {
        case 'primary':
          return props.theme.colors.accentActive
        case 'secondary':
          return props.theme.colors.backgroundModule
        case 'outline':
          return props.theme.colors.backgroundModule
        case 'critical':
          return props.theme.colors.accentFailure
        default:
          return props.theme.colors.accentActive
      }
    }};
  }

  &:active {
    transform: scale(0.99);
  }
`

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  isDisabled = false, 
  onPress, 
  icon,
  ...props 
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isDisabled) return
    if (onPress) onPress()
    if (props.onClick) props.onClick(e)
  }

  return (
    <StyledButton
      isDisabled={isDisabled}
      $isDisabled={isDisabled}
      onClick={handleClick}
      disabled={isDisabled}
      {...props}
    >
      {icon}
      {children}
    </StyledButton>
  )
}

Button.defaultProps = {
  variant: 'primary',
  emphasis: 'primary',
  size: 'medium',
  isDisabled: false,
  fullWidth: false,
}
