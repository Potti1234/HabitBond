import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/add')({
  component: Add
})

export default function Add () {
  return (
    <div>
      <h1>Add</h1>
    </div>
  )
}
