import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { BottomNavigation } from '../components/BottomNavigation'
import { Toaster } from '@/components/ui/sonner'

export const Route = createRootRoute({
  component: RootComponent
})

function RootComponent () {
  const router = useRouterState()
  const showNav = router.location.pathname !== '/login'

  return (
    <>
      <div className='flex flex-col min-h-screen'>
        <main className='flex-grow'>
          <Outlet />
        </main>
        {showNav && <BottomNavigation />}
      </div>
      <TanStackRouterDevtools />
      <Toaster />
    </>
  )
}
