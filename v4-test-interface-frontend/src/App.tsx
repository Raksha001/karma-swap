import React, { useState } from 'react'
import styled, { ThemeProvider } from 'styled-components'
import { ApolloProvider } from '@apollo/client'
import { CreatePoolForm } from './components/CreatePool/CreatePoolForm'
import { SwapForm } from './components/Swap/SwapForm'
import { Header, NavType } from './components/shared/Header'
import { GlobalStyle } from './theme/GlobalStyle'
import { theme } from './theme/theme'
import Analytics from './components/Analytics/Analytics'
import { client } from './apollo/client'
import { WalletProvider } from './contexts/WalletContext'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const AppWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.textPrimary};
`

const ContentWrapper = styled.div`
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 16px;
`

// Placeholder for Explore content
const ExplorePlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  background: ${({ theme }) => theme.colors.backgroundModule};
  border-radius: 16px;
  padding: 32px;
  text-align: center;
`

const PlaceholderTitle = styled.h2`
  font-size: 24px;
  margin-bottom: 16px;
  color: ${({ theme }) => theme.colors.neutral1};
`

const PlaceholderText = styled.p`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.neutral2};
  max-width: 600px;
`

export function App() {
  const [activeNav, setActiveNav] = useState<NavType>(NavType.TRADE)
  
  return (
    <WalletProvider>
      <ApolloProvider client={client}>
        <ThemeProvider theme={theme}>
          <GlobalStyle />
          <ToastContainer position="top-right" autoClose={5000} />
          <AppWrapper>
            <Header activeNav={activeNav} onNavChange={setActiveNav} />
            <ContentWrapper>
              {activeNav === NavType.TRADE && <SwapForm />}
            </ContentWrapper>
          </AppWrapper>
        </ThemeProvider>
      </ApolloProvider>
    </WalletProvider>
  )
}