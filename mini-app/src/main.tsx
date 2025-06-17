import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConvexProvider } from 'convex/react'
import './index.css'
import { MiniKitProvider } from '@worldcoin/minikit-js/minikit-provider'
import ErudaProvider from './components/eruda-provider.tsx'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { SessionProvider } from './hooks/useSession'
import ErrorComponent from './routes/error'
import NotFound from './routes/not-found'
import { routeTree } from './routeTree.gen.ts'
import { ThemeProvider } from './components/theme/theme-provider.tsx'
import { convex } from './lib/convex.ts'

const router = createRouter({
  routeTree,
  defaultErrorComponent: ErrorComponent,
  defaultNotFoundComponent: NotFound
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement)
  root.render(
    <StrictMode>
      <ThemeProvider defaultTheme='dark' storageKey='vite-ui-theme'>
        <ErudaProvider>
          <MiniKitProvider>
            <ConvexProvider client={convex}>
              <SessionProvider>
                <RouterProvider router={router} />
              </SessionProvider>
            </ConvexProvider>
          </MiniKitProvider>
        </ErudaProvider>
      </ThemeProvider>
    </StrictMode>
  )
}
