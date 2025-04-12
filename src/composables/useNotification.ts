import { ref } from 'vue'

export interface NotificationOptions {
  message: string
  description?: string
  type?: 'success' | 'error' | 'info' | 'warning'
  duration?: number
  icon?: string
}

// 使用全局状态存储通知
const notifications = ref<(NotificationOptions & { id: number })[]>([])
let notificationId = 0

export function useNotification() {
  const show = (options: NotificationOptions) => {
    const id = notificationId++
    const notification = {
      id,
      type: 'info',
      duration: 3000,
      icon: 'ph:info-fill',
      ...options
    }

    notifications.value.push(notification)

    if (notification.duration > 0) {
      setTimeout(() => {
        close(id)
      }, notification.duration)
    }
  }

  const close = (id: number) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  const success = (message: string, description?: string) => {
    show({
      message,
      description,
      type: 'success',
      icon: 'ph:check-circle-fill'
    })
  }

  const error = (message: string, description?: string) => {
    show({
      message,
      description,
      type: 'error',
      icon: 'ph:x-circle-fill'
    })
  }

  const warning = (message: string, description?: string, duration?: number) => {
    show({
      message,
      description,
      type: 'warning',
      icon: 'sf-symbols:exclamationmark-circle-fill',
      duration: duration
    })
  }

  const info = (message: string, description?: string, duration?: number) => {
    show({
      message,
      description,
      type: 'info',
      icon: 'sf-symbols:info-circle-fill',
      duration: duration
    })
  }

  return {
    notifications,
    show,
    close,
    success,
    error,
    warning,
    info
  }
} 