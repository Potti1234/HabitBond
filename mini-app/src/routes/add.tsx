'use client'
import { createFileRoute } from '@tanstack/react-router'
import { HabitForm } from '@/components/HabitForm'

export const Route = createFileRoute('/add')({
  component: Add
})

export default function Add () {
  return <HabitForm mode='create' />
}
