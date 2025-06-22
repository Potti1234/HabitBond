import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription
} from '@/components/ui/drawer'
import { HabitCalendar } from './HabitCalendar'
import { Button } from './ui/button'
import { EditIcon } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { Habit } from '@/types/habit'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useSession } from '@/hooks/useSession'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'

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
  const { sessionId } = useSession()
  const [days, setDays] = useState(30)
  const [stake, setStake] = useState(10)

  const createOrUpdateStreakGoal = useMutation(
    api.entity.habit.createOrUpdateStreakGoal
  )

  useEffect(() => {
    if (habit?.streakGoal) {
      setDays(habit.streakGoal.days)
      setStake(habit.streakGoal.stakeAmount)
    } else {
      setDays(30)
      setStake(10)
    }
  }, [habit])

  if (!habit) {
    return null
  }

  const handleEdit = () => {
    onClose()
    navigate({ to: '/habit/$habitId/edit', params: { habitId: habit._id } })
  }

  const handleSaveStreakGoal = async () => {
    if (!sessionId) {
      toast.error('You must be logged in to set a streak goal.')
      return
    }
    try {
      await createOrUpdateStreakGoal({
        sessionId,
        habitId: habit._id,
        days,
        stakeAmount: stake
      })
      toast.success('Streak goal saved!')
      onClose()
    } catch (error) {
      toast.error('Failed to save streak goal.')
      console.error(error)
    }
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
        <div className='px-4 pb-4'>
          <HabitCalendar completions={habit.completions} color={habit.color} />
          <Button onClick={handleEdit} className='mt-4 w-full'>
            <EditIcon className='mr-2 h-4 w-4' />
            Edit Habit
          </Button>

          <Card className='mt-4'>
            <CardHeader>
              <CardTitle>Streak Goal</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <Label htmlFor='days'>Goal (days)</Label>
                <Input
                  id='days'
                  type='number'
                  value={days}
                  onChange={e => setDays(parseInt(e.target.value, 10))}
                />
              </div>
              <div>
                <Label htmlFor='stake'>Stake (Worldcoin)</Label>
                <Input
                  id='stake'
                  type='number'
                  value={stake}
                  onChange={e => setStake(parseInt(e.target.value, 10))}
                />
              </div>
              <Button onClick={handleSaveStreakGoal} className='w-full'>
                {habit.streakGoal ? 'Update' : 'Set'} Streak Goal
              </Button>
            </CardContent>
          </Card>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
