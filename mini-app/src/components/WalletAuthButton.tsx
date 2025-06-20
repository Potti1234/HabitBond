'use client'

import { MiniKit } from '@worldcoin/minikit-js'
import { Button } from '@/components/ui/button'

type WalletAuthButtonProps = {
  onSignInComplete: (result: {
    isValid: boolean
    address: string | null
    sessionId: string | null
  }) => void
}

export function WalletAuthButton ({ onSignInComplete }: WalletAuthButtonProps) {
  const signInWithWallet = async () => {
    try {
      if (!MiniKit.isInstalled()) {
        console.log('MiniKit not installed')
        return
      }

      const convexUrl = import.meta.env.VITE_CONVEX_URL
      if (!convexUrl) {
        throw new Error('VITE_CONVEX_URL is not defined')
      }

      // For self-hosted Convex, the HTTP action URL is often different from the main URL
      // and does not follow the .cloud -> .site convention.
      // It's recommended to set this explicitly in your environment variables.
      const httpActionUrl =
        import.meta.env.VITE_CONVEX_HTTP_URL ??
        convexUrl.replace('.cloud', '.site')

      if (!import.meta.env.VITE_CONVEX_HTTP_URL) {
        console.warn(
          'VITE_CONVEX_HTTP_URL is not set. Falling back to replacing ".cloud" with ".site" for the HTTP action URL. This may not work for self-hosted deployments. Please set VITE_CONVEX_HTTP_URL to your backend\'s site origin (e.g., "https://<your-backend-url>/http").'
        )
      }

      const getNonceUrl = new URL(`${httpActionUrl}/getNonce`)
      const completeSiweUrl = new URL(`${httpActionUrl}/completesiwe`)

      const res = await fetch(getNonceUrl)

      if (!res.ok) {
        console.error('Failed to fetch nonce:', res.status, await res.text())
        return
      }
      const { nonce } = await res.json()

      const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
        nonce: nonce,
        requestId: '0', // Optional
        expirationTime: new Date(
          new Date().getTime() + 7 * 24 * 60 * 60 * 1000
        ),
        notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
        statement:
          'This is my statement and here is a link https://worldcoin.com/apps'
      })

      if (finalPayload.status === 'error') {
        return
      } else {
        const requestBody = {
          payload: finalPayload,
          nonce
        }
        const response = await fetch(completeSiweUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody),
          credentials: 'include'
        })

        if (!response.ok) {
          console.error(
            'Failed to complete SIWE:',
            response.status,
            await response.text()
          )
          return
        }

        const { isValid, address, sessionId } = await response.json()
        onSignInComplete({
          isValid,
          address: address ?? null,
          sessionId: sessionId ?? null
        })
      }
    } catch (error) {
      console.error('An unexpected error occurred during sign-in:', error)
    }
  }

  return <Button onClick={signInWithWallet}>Sign in with Worldcoin</Button>
}
