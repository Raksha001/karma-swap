import React from 'react'
import styled from 'styled-components'
import { RotateLeft } from './icons/RotateLeft'

interface ResetButtonProps {
  onClickReset: () => void
  isDisabled?: boolean
}

const Button = styled.button<{ $isDisabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 6px 10px;
  border: none;
  border-radius: 12px;
  background: ${({ theme, $isDisabled }) => 
    $isDisabled ? theme.colors.backgroundInteractive : theme.colors.backgroundInteractive};
  color: ${({ theme, $isDisabled }) => 
    $isDisabled ? theme.colors.neutral3 : theme.colors.neutral2};
  font-size: 14px;
  font-weight: 500;
  cursor: ${({ $isDisabled }) => ($isDisabled ? 'not-allowed' : 'pointer')};
  transition: all 125ms ease;
  user-select: none;

  &:hover {
    background: ${({ theme, $isDisabled }) => 
      $isDisabled ? theme.colors.backgroundInteractive : theme.colors.backgroundOutline};
  }

  &:active {
    transform: ${({ $isDisabled }) => ($isDisabled ? 'none' : 'scale(0.98)')};
  }
`

export const ResetButton: React.FC<ResetButtonProps> = ({ onClickReset, isDisabled = false }) => {
  return (
    <Button 
      onClick={isDisabled ? undefined : onClickReset} 
      $isDisabled={isDisabled}
      disabled={isDisabled}
    >
      <RotateLeft />
      Reset
    </Button>
  )
}
