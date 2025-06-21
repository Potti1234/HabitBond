import { useRef, useEffect } from 'react'
import { format, subDays, startOfYear, getDay } from 'date-fns'

export const HabitCalendar = ({
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
