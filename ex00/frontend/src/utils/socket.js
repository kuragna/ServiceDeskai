import { io } from 'socket.io-client'

let socket = null

export const connectSocket = (token) => {
  if (socket && socket.connected) {
    return socket
  }

  if (socket && !socket.connected) {
    socket.disconnect()
    socket = null
  }

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  const socketUrl = API_URL.replace('/api', '')

  socket = io(socketUrl, {
    auth: {
      token: token,
    },
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
    timeout: 20000,
    forceNew: true,
    upgrade: true,
    rememberUpgrade: false,
  })

  socket.on('connect', () => {
  })

  socket.on('disconnect', () => {
  })

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message)
  })

  socket.on('reconnect_attempt', () => {
  })

  socket.on('reconnect', () => {
  })

  socket.on('reconnect_error', (error) => {
    console.error('Socket reconnection error:', error.message)
  })

  socket.on('reconnect_failed', () => {
    console.error('Socket reconnection failed after all attempts')
  })

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export const getSocket = () => {
  return socket
}

