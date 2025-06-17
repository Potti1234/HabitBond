import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSession } from '@/hooks/useSession'
import { useEffect } from 'react'

export const Route = createFileRoute('/')({
  component: RouteComponent
})

function RouteComponent () {
  const { isLoading, user } = useSession()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: '/login', replace: true })
    }
  }, [isLoading, user, navigate])

  if (isLoading || !user) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1>Home</h1>
    </div>
  )
}
