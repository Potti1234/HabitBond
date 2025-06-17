import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/not-found')({
  component: NotFound
})

export default function NotFound () {
  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center p-4'>
      <h1 className='text-6xl font-bold text-gray-800'>404</h1>
      <h2 className='text-2xl font-semibold text-gray-600 mt-4'>
        Page Not Found
      </h2>
      <p className='text-gray-500 mt-2'>
        Sorry, the page you are looking for does not exist.
      </p>
      <Link
        to='/'
        className='mt-6 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600'
      >
        Go Home
      </Link>
    </div>
  )
}
