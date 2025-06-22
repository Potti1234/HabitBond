import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSession } from '@/hooks/useSession'
import { useEffect, useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckIcon, FlameIcon } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { HabitDetailDrawer } from '@/components/HabitDetailDrawer'
import { Habit } from '@/types/habit'
import { HabitCalendar } from '@/components/HabitCalendar'

function calculateStreak (completions: string[]): number {
  const completionSet = new Set(completions)
  if (completionSet.size === 0) {
    return 0
  }

  let checkDate = new Date()
  checkDate.setUTCHours(0, 0, 0, 0)

  const todayStr = checkDate.toISOString().slice(0, 10)

  let yesterday = new Date()
  yesterday.setUTCDate(checkDate.getUTCDate() - 1)
  yesterday.setUTCHours(0, 0, 0, 0)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)

  if (!completionSet.has(todayStr) && !completionSet.has(yesterdayStr)) {
    return 0
  }

  let currentStreak = 0

  if (!completionSet.has(todayStr)) {
    checkDate.setUTCDate(checkDate.getUTCDate() - 1)
  }

  while (true) {
    const dateStr = checkDate.toISOString().slice(0, 10)
    if (completionSet.has(dateStr)) {
      currentStreak++
      checkDate.setUTCDate(checkDate.getUTCDate() - 1)
    } else {
      break
    }
  }

  return currentStreak
}

export const Route = createFileRoute('/')({
  component: RouteComponent
})

function HabitCard ({
  habit,
  onHabitClick
}: {
  habit: Habit
  onHabitClick: (habit: Habit) => void
}) {
  const { sessionId } = useSession()
  const toggleCompletion = useMutation(
    api.entity.habit.toggleHabitCompletion
  ).withOptimisticUpdate((store, args) => {
    if (!args.sessionId) return

    const habits = store.getQuery(api.entity.habit.getHabits, {
      sessionId: args.sessionId
    })

    if (habits) {
      const newHabits = habits.map(h => {
        if (h._id === args.habitId) {
          const completions = new Set(h.completions)
          if (completions.has(args.date)) {
            completions.delete(args.date)
          } else {
            completions.add(args.date)
          }
          const newCompletions = Array.from(completions)
          const newStreak = calculateStreak(newCompletions)
          return { ...h, completions: newCompletions, streak: newStreak }
        }
        return h
      })
      store.setQuery(
        api.entity.habit.getHabits,
        { sessionId: args.sessionId },
        newHabits
      )
    }
  })

  const todayString = format(new Date(), 'yyyy-MM-dd')
  const isCompletedToday = habit.completions.includes(todayString)

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!sessionId) {
      toast.error('Not logged in')
      return
    }
    try {
      await toggleCompletion({
        sessionId,
        habitId: habit._id,
        date: todayString
      })
    } catch (error) {
      toast.error('Failed to update habit.')
      console.error(error)
    }
  }

  return (
    <Card onClick={() => onHabitClick(habit)} className='cursor-pointer'>
      <CardHeader>
        <div className='flex items-start justify-between'>
          <div className='flex items-start gap-4'>
            <div className='text-4xl'>{habit.emoji}</div>
            <div>
              <CardTitle>{habit.name}</CardTitle>
              <p className='text-muted-foreground'>{habit.description}</p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            {habit.streak > 0 && (
              <div className='flex items-center gap-1 text-muted-foreground'>
                <FlameIcon
                  className={`h-5 w-5 ${
                    isCompletedToday ? 'text-red-500' : ''
                  }`}
                />
                <span className='font-bold'>{habit.streak}</span>
              </div>
            )}
            <Button
              size='icon'
              variant={isCompletedToday ? 'default' : 'outline'}
              onClick={handleToggle}
              style={
                isCompletedToday
                  ? { backgroundColor: habit.color, color: 'white' }
                  : {}
              }
            >
              <CheckIcon />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <HabitCalendar completions={habit.completions} color={habit.color} />
      </CardContent>
    </Card>
  )
}

function RouteComponent () {
  const { isLoading: isSessionLoading, user, sessionId } = useSession()
  const navigate = useNavigate()
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null)

  const habits = useQuery(
    api.entity.habit.getHabits,
    sessionId ? { sessionId } : 'skip'
  )

  useEffect(() => {
    if (!isSessionLoading && !user) {
      navigate({ to: '/login', replace: true })
    }
  }, [isSessionLoading, user, navigate])

  if (isSessionLoading || !user || habits === undefined) {
    return <div>Loading...</div>
  }

  return (
    <div className='p-4 md:p-8'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-3xl font-bold'>Your Habits</h1>
        <Button onClick={() => navigate({ to: '/add' })}>Add Habit</Button>
      </div>
      {habits.length === 0 ? (
        <div className='text-center py-12'>
          <p className='text-lg text-muted-foreground'>
            You haven't created any habits yet.
          </p>
          <Button onClick={() => navigate({ to: '/add' })} className='mt-4'>
            Create your first habit
          </Button>
        </div>
      ) : (
        <div className='space-y-4'>
          {(habits as Habit[]).map(habit => (
            <HabitCard
              key={habit._id}
              habit={habit}
              onHabitClick={setSelectedHabit}
            />
          ))}
        </div>
      )}
      <HabitDetailDrawer
        habit={selectedHabit}
        isOpen={!!selectedHabit}
        onClose={() => setSelectedHabit(null)}
      />
    </div>
  )
}
