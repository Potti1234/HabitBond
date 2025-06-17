import { createFileRoute } from '@tanstack/react-router'
import { useSession } from '../hooks/useSession'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ModeToggle } from '@/components/theme/mode-toggle'

export const Route = createFileRoute('/profile')({
  component: Profile
})

function Profile () {
  const { user, isLoading } = useSession()

  if (isLoading) {
    return <div className='p-2'>Loading...</div>
  }

  if (!user) {
    return <div className='p-2'>You are not logged in.</div>
  }

  return (
    <div className='flex flex-col items-center p-4'>
      <Avatar className='h-32 w-32'>
        <AvatarImage src={user.profile_picture_url} alt='Profile' />
        <AvatarFallback>
          {user.username?.substring(0, 2).toUpperCase() ?? 'AN'}
        </AvatarFallback>
      </Avatar>
      <p className='mt-4 text-lg'>Name: {user.username ?? 'Anonymous'}</p>
      <div className='absolute top-4 right-4'>
        <ModeToggle />
      </div>
    </div>
  )
}
