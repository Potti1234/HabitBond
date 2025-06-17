import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { createContext, useContext, useState } from 'react'

type SessionContextType = {
  user: any | null
  sessionId: string | null
  isLoading: boolean
  setSessionId: (sessionId: string) => void
}

const SessionContext = createContext<SessionContextType | null>(null)

export const SessionProvider = ({
  children
}: {
  children: React.ReactNode
}) => {
  const [sessionId, setSessionId] = useState<string | null>(() =>
    localStorage.getItem('sessionId')
  )

  const user = useQuery(
    api.login.getCurrentUser,
    sessionId ? { sessionId } : 'skip'
  )

  const isLoading = user === undefined && sessionId !== null

  return (
    <SessionContext.Provider
      value={{
        user,
        sessionId,
        isLoading,
        setSessionId: (newSessionId: string) => {
          localStorage.setItem('sessionId', newSessionId)
          setSessionId(newSessionId)
        }
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}

export const useSession = () => {
  const context = useContext(SessionContext)
  if (context === null) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}
