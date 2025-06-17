import React, { useEffect } from 'react'

type ErudaProviderProps = {
  children: React.ReactNode
}

const ErudaProvider: React.FC<ErudaProviderProps> = ({ children }) => {
  useEffect(() => {
    if (import.meta.env.DEV) {
      import('eruda').then(eruda => {
        eruda.default.init()
      })
    }
  }, [])

  return <>{children}</>
}

export default ErudaProvider
