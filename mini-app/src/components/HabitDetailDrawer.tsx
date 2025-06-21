import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription
} from '@/components/ui/drawer'
import { Id } from '../../convex/_generated/dataModel'
import { HabitCalendar } from './HabitCalendar'
import { Button } from './ui/button'
import { EditIcon } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { Habit } from '@/types/habit'

interface HabitDetailDrawerProps {
  habit: Habit | null
  isOpen: boolean
  onClose: () => void
}

export function HabitDetailDrawer ({
  habit,
  isOpen,
  onClose
}: HabitDetailDrawerProps) {
  const navigate = useNavigate()

  if (!habit) {
    return null
  }

  const handleEdit = () => {
    onClose()
    navigate({ to: '/habit/$habitId/edit', params: { habitId: habit._id } })
  }

  return (
    <Drawer open={isOpen} onOpenChange={open => !open && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <div className='flex items-center gap-4 mb-4'>
            <div className='text-6xl'>{habit.emoji}</div>
            <div>
              <DrawerTitle className='text-2xl'>{habit.name}</DrawerTitle>
              {habit.description && (
                <DrawerDescription>{habit.description}</DrawerDescription>
              )}
            </div>
          </div>
        </DrawerHeader>
        <div className='p-4'>
          <HabitCalendar completions={habit.completions} color={habit.color} />
          <Button onClick={handleEdit} className='mt-4 w-full'>
            <EditIcon className='mr-2 h-4 w-4' />
            Edit Habit
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
