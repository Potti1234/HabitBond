import { Link, useRouterState } from '@tanstack/react-router'
import { Home, Plus, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function BottomNavigation () {
  const { location } = useRouterState()

  return (
    <div className='border-t bg-background/95 backdrop-blur-sm'>
      <div className='container flex h-16 max-w-md items-center justify-around'>
        <Link to='/' className='flex flex-col items-center'>
          <Button
            variant='ghost'
            className={cn('h-auto rounded-full p-3', {
              'bg-muted': location.pathname === '/'
            })}
          >
            <Home
              className={cn('h-6 w-6', {
                'text-foreground': location.pathname === '/',
                'text-muted-foreground': location.pathname !== '/'
              })}
            />
          </Button>
          <span className='text-xs text-muted-foreground'>Streams</span>
        </Link>
        <Link to='/add' className='flex flex-col items-center'>
          <Button
            variant='ghost'
            className={cn('h-auto rounded-full p-3', {
              'bg-muted': location.pathname === '/add'
            })}
          >
            <Plus
              className={cn('h-6 w-6', {
                'text-foreground': location.pathname === '/add',
                'text-muted-foreground': location.pathname !== '/add'
              })}
            />
          </Button>
          <span className='text-xs text-muted-foreground'>Add</span>
        </Link>
        <Link to='/profile' className='flex flex-col items-center'>
          <Button
            variant='ghost'
            className={cn('h-auto rounded-full p-3', {
              'bg-muted': location.pathname === '/profile'
            })}
          >
            <User
              className={cn('h-6 w-6', {
                'text-foreground': location.pathname === '/profile',
                'text-muted-foreground': location.pathname !== '/profile'
              })}
            />
          </Button>
          <span className='text-xs text-muted-foreground'>Profile</span>
        </Link>
      </div>
    </div>
  )
}
