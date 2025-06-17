import {
  MiniKit,
  VerificationLevel,
  PayCommandInput,
  tokenToDecimals,
  Tokens,
  Permission
} from '@worldcoin/minikit-js'
import { convex } from './convex'
import { api } from '../../convex/_generated/api'

/**
 * NOTE: Before using, you need to add `@worldcoin/minikit-js` to your dependencies.
 * You can do this by running `pnpm add @worldcoin/minikit-js` in the `mini-app` directory.
 */
export const handleVerify = async (
  sessionId: string,
  verification_level: VerificationLevel = VerificationLevel.Orb
) => {
  if (!MiniKit.isInstalled()) {
    console.log('MiniKit not installed')
    return
  }

  const action = 'stream-verification'
  const signal = ''

  const verifyPayload = {
    action: action,
    signal: signal,
    verification_level: verification_level
  }

  try {
    const { finalPayload } = await MiniKit.commandsAsync.verify(verifyPayload)

    if (finalPayload.status === 'error') {
      console.error('Error payload', finalPayload)
      throw new Error(`Verification failed: ${JSON.stringify(finalPayload)}`)
    }

    const result = await convex.action(api.worldcoin.verify, {
      payload: finalPayload,
      action: action,
      signal: signal,
      sessionId: sessionId
    })

    if (result.success) {
      console.log('Verification success!', result)
    } else {
      console.error('Verification failed', result)
      throw new Error(result.detail || 'Verification failed')
    }
    return result
  } catch (error) {
    console.error('Error during verification process:', error)
    throw error
  }
}

export const handlePay = async (
  sessionId: string,
  toAddress: string,
  amount: number
) => {
  if (!MiniKit.isInstalled()) {
    console.log('MiniKit not installed')
    return
  }

  try {
    const { reference } = await convex.action(api.worldcoin.initiatePayment, {
      sessionId
    })

    if (!reference) {
      throw new Error('Failed to initiate payment.')
    }

    const payload: PayCommandInput = {
      reference: reference,
      to: toAddress,
      tokens: [
        {
          symbol: Tokens.WLD,
          token_amount: tokenToDecimals(amount, Tokens.WLD).toString()
        }
      ],
      description: 'Donation for World Stream'
    }

    const { finalPayload } = await MiniKit.commandsAsync.pay(payload)

    if (finalPayload.status === 'success') {
      const result = await convex.action(api.worldcoin.verifyPayment, {
        payload: finalPayload,
        sessionId: sessionId
      })
      if (result.success) {
        console.log('Payment success!', result)
      } else {
        console.error('Payment verification failed', result)
        throw new Error(result.detail || 'Payment verification failed')
      }
      return result
    } else {
      console.error('Error payload', finalPayload)
      throw new Error(`Payment failed: ${JSON.stringify(finalPayload)}`)
    }
  } catch (error) {
    console.error('Error during payment process:', error)
    throw error
  }
}

export const handleRequestAudioPermission = async () => {
  if (!MiniKit.isInstalled()) {
    console.log('MiniKit not installed')
    return
  }

  try {
    const result = await MiniKit.commandsAsync.requestPermission({
      permission: Permission.Microphone
    })

    if (result.finalPayload.status === 'success') {
      console.log('Permission success!', result)
      return { success: true }
    }

    if (result.finalPayload.status === 'error') {
      if (result.finalPayload.error_code === 'already_granted') {
        console.log('Permission already granted')
        return { success: true }
      }
      console.error('Permission request failed', result)
      throw new Error(result.finalPayload.error_code || 'Permission request failed')
    }
  } catch (error) {
    console.error('Error during permission request process:', error)
    throw error
  }
} 