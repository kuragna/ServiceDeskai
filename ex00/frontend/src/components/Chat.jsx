import React, { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { connectSocket, disconnectSocket, getSocket } from '../utils/socket'
import { toast } from 'react-toastify'

const Chat = ({ ticketId, ticket }) => {
  const [messageContent, setMessageContent] = useState('')
  const [ticketMessages, setTicketMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef(null)
  const socketRef = useRef(null)

  const { user, token } = useSelector(state => state.auth)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (!ticketId || !user) {
      return
    }

    const authToken = token || localStorage.getItem('token')
    if (!authToken) {
      toast.error('Authentication required')
      return
    }

    const socket = connectSocket(authToken)
    socketRef.current = socket

    const handleConnect = () => {
      setIsConnected(true)
      setIsLoading(true)
      socket.emit('join-ticket', ticketId)
    }

    const handleDisconnect = () => {
      setIsConnected(false)
    }

    const handleConnectError = (error) => {
      console.error('Socket connection error:', error)
      toast.error('Failed to connect to chat server. Please refresh the page.')
      setIsConnected(false)
      setIsLoading(false)
    }

    const handleMessagesLoaded = (data) => {
      setTicketMessages(data.messages || [])
      setIsLoading(false)
      setTimeout(scrollToBottom, 100)
    }

    const handleNewMessage = (data) => {
      setTicketMessages(prev => {
        const exists = prev.some(msg => msg._id === data.message._id)
        if (exists) return prev
        return [...prev, data.message]
      })
      setTimeout(scrollToBottom, 100)
    }

    const handleError = (error) => {
      toast.error(error.message || 'An error occurred')
      setIsLoading(false)
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('connect_error', handleConnectError)
    socket.on('messages-loaded', handleMessagesLoaded)
    socket.on('new-message', handleNewMessage)
    socket.on('error', handleError)

    if (socket.connected) {
      handleConnect()
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off('connect', handleConnect)
        socketRef.current.off('disconnect', handleDisconnect)
        socketRef.current.off('connect_error', handleConnectError)
        socketRef.current.off('messages-loaded', handleMessagesLoaded)
        socketRef.current.off('new-message', handleNewMessage)
        socketRef.current.off('error', handleError)
        if (ticketId && socketRef.current.connected && typeof socketRef.current.leave === 'function') {
          try {
            socketRef.current.leave(`ticket-${ticketId}`)
          } catch (error) {
            console.warn('Error leaving socket room:', error)
          }
        }
      }
    }
  }, [ticketId, user, token])

  useEffect(() => {
    scrollToBottom()
  }, [ticketMessages])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!messageContent.trim()) {
      return
    }

    if (!canSendMessages()) {
      if (user.role === 'standard' && !ticket.assignedTo) {
        toast.error('Ticket must be assigned before you can send messages')
      } else {
        toast.error('You do not have permission to send messages')
      }
      return
    }

    if (!socketRef.current || !socketRef.current.connected) {
      toast.error('Not connected to chat server. Please refresh the page.')
      return
    }

    setIsLoading(true)
    socketRef.current.emit('send-message', {
      ticketId,
      content: messageContent.trim(),
    })

    setMessageContent('')
    setIsLoading(false)
  }

  if (!user || !ticket || !ticketId) {
    return (
      <div className="chat-container" style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
        <p>Loading chat...</p>
      </div>
    )
  }


  const canChat = () => {
    if (!ticket || !user) {
      return false
    }
    
    const userRole = user.role
    
    if (userRole === 'service_desk') {
      return true
    }
    
    if (userRole === 'standard') {
      const reporterId = ticket.reporter?._id || ticket.reporter
      const userId = user.id || user._id
      
      if (!reporterId || !userId) {
        return false
      }
      
      const isReporter = reporterId.toString() === userId.toString()
      if (!isReporter) {
        return false
      }
      
      let assignedToExists = false
      
      if (ticket.assignedTo) {
        if (typeof ticket.assignedTo === 'object') {
          assignedToExists = ticket.assignedTo._id || Object.keys(ticket.assignedTo).length > 0
        } else if (typeof ticket.assignedTo === 'string') {
          assignedToExists = ticket.assignedTo.length > 0
        }
      }
      
      const hasAssignedStatus = ['assigned', 'in-progress', 'closed'].includes(ticket.status)
      
      const isAssigned = assignedToExists || hasAssignedStatus
      
      return isAssigned
    }
    
    return false
  }

  const canViewChat = canChat()
  
  if (!canViewChat) {
    return (
      <div className="chat-container" style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
        <p>This ticket must be assigned before you can view the chat.</p>
      </div>
    )
  }

  const canSendMessages = () => {
    if (!user) return false
    
    const userRole = user.role
    
    if (userRole === 'service_desk') {
      return true
    }
    
    if (userRole === 'standard') {
      const reporterId = ticket.reporter?._id || ticket.reporter
      const userId = user.id || user._id
      if (reporterId && userId) {
        try {
          const isReporter = reporterId.toString() === userId.toString()
          return isReporter && !!ticket.assignedTo
        } catch (e) {
          console.error('Error checking reporter:', e)
          return false
        }
      }
    }
    
    return false
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>Chat</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span 
            className="chat-status" 
            aria-live="polite"
            style={{ 
              fontSize: '0.875rem',
              color: isConnected ? '#28a745' : '#dc3545'
            }}
          >
            {isConnected ? '● Connected' : '○ Connecting...'}
          </span>
          <span className="chat-status" aria-live="polite">
            {ticketMessages.length} message{ticketMessages.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="chat-messages" role="log" aria-label="Chat messages">
        {isLoading && ticketMessages.length === 0 ? (
          <div className="chat-empty" role="status">
            <p>Loading messages...</p>
          </div>
        ) : ticketMessages.length === 0 ? (
          <div className="chat-empty" role="status">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          ticketMessages.map((msg) => {
            const userId = user.id || user._id
            const isOwnMessage = msg.sender?._id === userId || msg.sender === userId || msg.sender?._id?.toString() === userId?.toString()
            return (
              <div
                key={msg._id}
                className={`chat-message ${isOwnMessage ? 'chat-message-own' : 'chat-message-other'}`}
                role="article"
                aria-label={`Message from ${msg.sender?.name || 'Unknown'}`}
              >
                <div className="chat-message-header">
                  <strong>{msg.sender?.name || 'Unknown'}</strong>
                  <span className="chat-message-time">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="chat-message-content">{msg.content}</div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-form" aria-label="Send message form">
        <div className="chat-input-wrapper">
          <input
            type="text"
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            placeholder="Type your message..."
            className="chat-input"
            aria-label="Message input"
            aria-required="true"
            disabled={isLoading || !canSendMessages() || !isConnected}
          />
          <button
            type="submit"
            className="btn btn-primary chat-send-button"
            disabled={isLoading || !messageContent.trim() || !canSendMessages() || !isConnected}
            aria-label="Send message"
            aria-busy={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
        {!canSendMessages() && (
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#666', textAlign: 'center' }}>
            {user && user.role === 'standard' && !ticket.assignedTo
              ? 'Ticket must be assigned before you can send messages.'
              : 'You cannot send messages on this ticket.'}
          </p>
        )}
      </form>
    </div>
  )
}

export default Chat

