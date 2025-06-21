import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useSession } from '@/hooks/useSession'
import { HabitForm } from '@/components/HabitForm'
import { Id } from '../../convex/_generated/dataModel'

export const Route = createFileRoute('/habit/$habitId/edit')({
  component: EditHabitComponent
})

function EditHabitComponent () {
  const { habitId } = Route.useParams()
  const { sessionId } = useSession()
  const navigate = useNavigate()

  const habit = useQuery(
    api.entity.habit.getHabit,
    sessionId ? { sessionId, habitId: habitId as Id<'habits'> } : 'skip'
  )

  if (habit === undefined) {
    return <div>Loading...</div>
  }

  if (habit === null) {
    return <div>Habit not found or you don't have permission to edit it.</div>
  }

  return (
    <HabitForm mode='edit' habit={habit} onSave={() => navigate({ to: '/' })} />
  )
}
