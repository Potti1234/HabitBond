import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSession } from '@/hooks/useSession'
import { useEffect, useRef } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckIcon } from 'lucide-react'
import { toast } from 'sonner'
import { format, subDays, startOfYear, getDay } from 'date-fns'

export const Route = createFileRoute('/')({
  component: RouteComponent
})

const HabitCalendar = ({
  completions,
  color
}: {
  completions: string[]
  color: string
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const today = new Date()
  const yearStart = startOfYear(today)
  const days = Array.from({ length: 365 }, (_, i) => subDays(today, 364 - i))
  const dayOffset = getDay(yearStart) === 0 ? 6 : getDay(yearStart) - 1

  const completionSet = new Set(completions)

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft =
        scrollContainerRef.current.scrollWidth
    }
  }, [])

  return (
    <div className='overflow-x-auto pb-2' ref={scrollContainerRef}>
      <div className='inline-grid grid-flow-col auto-cols-max grid-rows-7 gap-1'>
        {Array.from({ length: dayOffset }).map((_, i) => (
          <div key={`offset-${i}`} />
        ))}
        {days.map(day => {
          const dateString = format(day, 'yyyy-MM-dd')
          const isCompleted = completionSet.has(dateString)
          return (
            <div
              key={dateString}
              className='w-4 h-4 rounded-sm'
              style={{ backgroundColor: isCompleted ? color : '#ebedf0' }}
              title={dateString}
            />
          )
        })}
      </div>
    </div>
  )
}

function HabitCard ({
  habit
}: {
  habit: {
    _id: Id<'habits'>
    name: string
    description?: string
    emoji: string
    color: string
    completions: string[]
  }
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
          return { ...h, completions: Array.from(completions) }
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

  const handleToggle = async () => {
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
    <Card>
      <CardHeader>
        <div className='flex items-start justify-between'>
          <div className='flex items-start gap-4'>
            <div className='text-4xl'>{habit.emoji}</div>
            <div>
              <CardTitle>{habit.name}</CardTitle>
              <p className='text-muted-foreground'>{habit.description}</p>
            </div>
          </div>
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
          {habits.map(habit => (
            <HabitCard key={habit._id} habit={habit} />
          ))}
        </div>
      )}
    </div>
  )
}
