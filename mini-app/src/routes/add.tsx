'use client'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import {
  EmojiPicker,
  EmojiPickerContent,
  EmojiPickerSearch
} from '@/components/ui/emoji-picker'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { toast } from 'sonner'
import { useSession } from '@/hooks/useSession'

export const Route = createFileRoute('/add')({
  component: Add
})

const colors = [
  '#FF6B6B',
  '#FF8E8E',
  '#FFBDBD',
  '#FFE0E0',
  '#FFD166',
  '#FFE08C',
  '#FFEEB3',
  '#FFF5D6',
  '#06D6A0',
  '#63E2B7',
  '#A9EED2',
  '#D4F5E9',
  '#118AB2',
  '#63B4CF',
  '#A9D9E6',
  '#D4ECF2',
  '#073B4C',
  '#537A86',
  '#91B0B8',
  '#C3D4D8',
  '#FFDDC1',
  '#FFD1A6',
  '#FFC58B',
  '#FFB970',
  '#FFB3DE',
  '#FFA6D2',
  '#FF99C6',
  '#FF8CB9',
  '#CDB4DB',
  '#C1A3D1',
  '#B592C7',
  '#A981BD',
  '#BDE0FE',
  '#A2D2FF',
  '#8AC4FF',
  '#72B6FF',
  '#F4A261',
  '#E76F51',
  '#E9C46A',
  '#2A9D8F'
]

export default function Add () {
  const [emoji, setEmoji] = useState('🎉')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(colors[0])
  const [popoverOpen, setPopoverOpen] = useState(false)
  const { sessionId } = useSession()

  const createHabit = useMutation(api.entity.habit.createHabit)
  const navigate = useNavigate({ from: '/add' })

  const handleSave = async () => {
    if (!sessionId) {
      toast.error('Authentication error. Please log in again.')
      return
    }

    if (!name.trim()) {
      toast.error('Please enter a name for the habit.')
      return
    }

    if (!emoji) {
      toast.error('Please select an emoji for the habit.')
      return
    }

    if (!color) {
      toast.error('Please select a color for the habit.')
      return
    }

    try {
      await createHabit({
        name,
        description,
        emoji,
        color,
        sessionId
      })
      toast.success('Habit created successfully!')
      navigate({ to: '/' })
    } catch (error) {
      toast.error('Failed to create habit.')
      console.error(error)
    }
  }

  return (
    <div className='p-4 max-w-md mx-auto'>
      <h1 className='text-2xl font-bold mb-4 text-center'>
        Create a new Habit
      </h1>

      <div className='flex justify-center mb-4'>
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant='outline' className='text-6xl h-24 w-24'>
              {emoji}
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-auto p-0'>
            <EmojiPicker
              onEmojiSelect={e => {
                setEmoji(e.emoji)
                setPopoverOpen(false)
              }}
            >
              <EmojiPickerSearch />
              <EmojiPickerContent />
            </EmojiPicker>
          </PopoverContent>
        </Popover>
      </div>

      <div className='space-y-4'>
        <div>
          <label
            htmlFor='name'
            className='block text-sm font-medium text-gray-700'
          >
            Name
          </label>
          <Input
            id='name'
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder='e.g., Drink Water'
            className='mt-1'
          />
        </div>
        <div>
          <label
            htmlFor='description'
            className='block text-sm font-medium text-gray-700'
          >
            Description
          </label>
          <Textarea
            id='description'
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder='e.g., Drink 8 glasses of water every day'
            className='mt-1'
          />
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700'>
            Color
          </label>
          <div className='grid grid-cols-10 gap-2 mt-2'>
            {colors.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-full h-8 rounded-md border-2 ${
                  color === c ? 'border-black' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <Button onClick={handleSave} className='w-full'>
          Save Habit
        </Button>
      </div>
    </div>
  )
}
