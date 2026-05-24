import { SocketProvider } from '@/providers/SocketProvider'
import React from 'react'

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SocketProvider>
      {children}
    </SocketProvider>
  )
}

export default MainLayout
