import { useState, useCallback } from 'react'
import { Toast } from '@/components/ui/toast'

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastOptions = Partial<ToastProps> & {
  title?: string
  description?: string
  action?: React.ReactNode
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastOptions[]>([])

  const addToast = useCallback((options: ToastOptions) => {
    setToasts((prevToasts) => [...prevToasts, options])
  }, [])

  const dismissToast = useCallback((index: number) => {
    setToasts((prevToasts) => prevToasts.filter((_, i) => i !== index))
  }, [])

  const toast = useCallback((options: ToastOptions) => {
    addToast(options)
    setTimeout(() => {
      dismissToast(toasts.length)
    }, 5000)
  }, [addToast, dismissToast, toasts.length])

  return { toast, toasts, dismissToast }
}