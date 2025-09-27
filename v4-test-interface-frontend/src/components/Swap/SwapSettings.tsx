import React, { useState } from 'react'
import styled from 'styled-components'
import { Settings } from '../shared/icons'

const SettingsButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ theme }: any) => theme.colors.neutral2};
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: ${({ theme }: any) => theme.colors.backgroundInteractive};
    color: ${({ theme }: any) => theme.colors.neutral1};
  }
`

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`

const ModalContent = styled.div`
  background: ${({ theme }: any) => theme.colors.background};
  border-radius: 20px;
  width: 90%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid ${({ theme }: any) => theme.colors.backgroundOutline};
`

const ModalTitle = styled.h2`
  font-size: 16px;
  font-weight: 500;
  margin: 0;
  color: ${({ theme }: any) => theme.colors.neutral1};
`

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ theme }: any) => theme.colors.neutral3};
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  
  &:hover {
    color: ${({ theme }: any) => theme.colors.neutral2};
  }
`

const SettingsContent = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const SettingGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const SettingLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }: any) => theme.colors.neutral1};
`

const SettingDescription = styled.p`
  font-size: 14px;
  color: ${({ theme }: any) => theme.colors.neutral2};
  margin: 0;
`

const SlippageInputs = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`

const SlippageButton = styled.button<{ $active?: boolean }>`
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid ${({ theme, $active }: { theme: any; $active?: boolean }) => 
    $active ? theme.colors.accentAction : theme.colors.backgroundOutline};
  background: ${({ theme, $active }: { theme: any; $active?: boolean }) => 
    $active ? theme.colors.accentAction + '20' : theme.colors.backgroundInteractive};
  color: ${({ theme }: any) => theme.colors.neutral1};
  font-size: 14px;
  cursor: pointer;
  
  &:hover {
    border-color: ${({ theme }: any) => theme.colors.accentAction};
  }
`

const CustomInputContainer = styled.div`
  display: flex;
  align-items: center;
  border: 1px solid ${({ theme }: any) => theme.colors.backgroundOutline};
  border-radius: 12px;
  padding: 0 12px;
  background: ${({ theme }: any) => theme.colors.backgroundInteractive};
  
  &:focus-within {
    border-color: ${({ theme }: any) => theme.colors.accentAction};
  }
`

const CustomInput = styled.input`
  width: 60px;
  padding: 8px 0;
  border: none;
  background: transparent;
  color: ${({ theme }: any) => theme.colors.neutral1};
  font-size: 14px;
  outline: none;
  text-align: right;
`

const InputSuffix = styled.span`
  color: ${({ theme }: any) => theme.colors.neutral2};
  font-size: 14px;
`

const DeadlineInputContainer = styled.div`
  display: flex;
  align-items: center;
  border: 1px solid ${({ theme }: any) => theme.colors.backgroundOutline};
  border-radius: 12px;
  padding: 0 12px;
  background: ${({ theme }: any) => theme.colors.backgroundInteractive};
  width: fit-content;
  
  &:focus-within {
    border-color: ${({ theme }: any) => theme.colors.accentAction};
  }
`

const DeadlineInput = styled.input`
  width: 60px;
  padding: 8px 0;
  border: none;
  background: transparent;
  color: ${({ theme }: any) => theme.colors.neutral1};
  font-size: 14px;
  outline: none;
  text-align: right;
`

interface SwapSettingsProps {
  slippageTolerance: number
  deadline: number
  onSlippageChange: (slippage: number) => void
  onDeadlineChange: (deadline: number) => void
}

export function SwapSettings({
  slippageTolerance,
  deadline,
  onSlippageChange,
  onDeadlineChange
}: SwapSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [customSlippage, setCustomSlippage] = useState('')
  const [customDeadline, setCustomDeadline] = useState(deadline.toString())
  
  const handleSlippageButtonClick = (slippage: number) => {
    onSlippageChange(slippage)
    setCustomSlippage('')
  }
  
  const handleCustomSlippageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCustomSlippage(value)
    
    if (value && !isNaN(parseFloat(value))) {
      onSlippageChange(parseFloat(value))
    }
  }
  
  const handleDeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCustomDeadline(value)
    
    if (value && !isNaN(parseInt(value))) {
      onDeadlineChange(parseInt(value))
    }
  }
  
  const predefinedSlippages = [0.1, 0.5, 1.0]
  const isCustomSlippage = !predefinedSlippages.includes(slippageTolerance)
  
  return (
    <>
      <SettingsButton onClick={() => setIsOpen(true)}>
        <Settings width={20} height={20} />
      </SettingsButton>
      
      {isOpen && (
        <ModalOverlay onClick={() => setIsOpen(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Transaction Settings</ModalTitle>
              <CloseButton onClick={() => setIsOpen(false)}>×</CloseButton>
            </ModalHeader>
            
            <SettingsContent>
              <SettingGroup>
                <SettingLabel>Slippage tolerance</SettingLabel>
                <SettingDescription>
                  Your transaction will revert if the price changes unfavorably by more than this percentage.
                </SettingDescription>
                
                <SlippageInputs>
                  {predefinedSlippages.map(slippage => (
                    <SlippageButton
                      key={slippage}
                      $active={slippageTolerance === slippage}
                      onClick={() => handleSlippageButtonClick(slippage)}
                    >
                      {slippage}%
                    </SlippageButton>
                  ))}
                  
                  <CustomInputContainer>
                    <CustomInput
                      placeholder="Custom"
                      value={isCustomSlippage ? customSlippage || slippageTolerance : customSlippage}
                      onChange={handleCustomSlippageChange}
                    />
                    <InputSuffix>%</InputSuffix>
                  </CustomInputContainer>
                </SlippageInputs>
              </SettingGroup>
              
              <SettingGroup>
                <SettingLabel>Transaction deadline</SettingLabel>
                <SettingDescription>
                  Your transaction will revert if it is pending for more than this period of time.
                </SettingDescription>
                
                <DeadlineInputContainer>
                  <DeadlineInput
                    value={customDeadline}
                    onChange={handleDeadlineChange}
                  />
                  <InputSuffix>minutes</InputSuffix>
                </DeadlineInputContainer>
              </SettingGroup>
            </SettingsContent>
          </ModalContent>
        </ModalOverlay>
      )}
    </>
  )
} 