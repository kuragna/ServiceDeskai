import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const getConfig = () => {
  const token = localStorage.getItem('token')
  if (!token) {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    window.location.href = '/login'
    throw new Error('No authentication token found. Please log in again.')
  }
  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  }
}

const handleAuthError = (response) => {
  if (response.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
    return true
  }
  return false
}

const initialState = {
  messages: {},
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
}

export const getTicketMessages = createAsyncThunk(
  'messages/getTicketMessages',
  async (ticketId, thunkAPI) => {
    try {
      const response = await fetch(`${API_URL}/messages/ticket/${ticketId}`, getConfig())

      const data = await response.json()

      if (!response.ok) {
        if (handleAuthError(response)) {
          return thunkAPI.rejectWithValue('Session expired. Please log in again.')
        }
        return thunkAPI.rejectWithValue(
          data.message || 'Failed to fetch messages'
        )
      }

      return { ticketId, messages: data.data.messages }
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message)
    }
  }
)

export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async ({ ticketId, content }, thunkAPI) => {
    try {
      const response = await fetch(`${API_URL}/messages/ticket/${ticketId}`, {
        method: 'POST',
        ...getConfig(),
        body: JSON.stringify({ content }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (handleAuthError(response)) {
          return thunkAPI.rejectWithValue('Session expired. Please log in again.')
        }
        return thunkAPI.rejectWithValue(
          data.message || 'Failed to send message'
        )
      }

      return { ticketId, message: data.data.message }
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message)
    }
  }
)

export const markMessagesAsRead = createAsyncThunk(
  'messages/markAsRead',
  async (ticketId, thunkAPI) => {
    try {
      const response = await fetch(`${API_URL}/messages/ticket/${ticketId}/read`, {
        method: 'PATCH',
        ...getConfig(),
      })

      const data = await response.json()

      if (!response.ok) {
        if (handleAuthError(response)) {
          return thunkAPI.rejectWithValue('Session expired. Please log in again.')
        }
        return thunkAPI.rejectWithValue(
          data.message || 'Failed to mark messages as read'
        )
      }

      return ticketId
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message)
    }
  }
)

export const messageSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    reset: state => {
      state.isLoading = false
      state.isSuccess = false
      state.isError = false
      state.message = ''
    },
    addMessage: (state, action) => {
      const { ticketId, message } = action.payload
      if (!state.messages[ticketId]) {
        state.messages[ticketId] = []
      }
      state.messages[ticketId].push(message)
    },
    clearMessages: (state, action) => {
      const ticketId = action.payload
      if (ticketId) {
        delete state.messages[ticketId]
      } else {
        state.messages = {}
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getTicketMessages.pending, state => {
        state.isLoading = true
      })
      .addCase(getTicketMessages.fulfilled, (state, action) => {
        state.isLoading = false
        state.isSuccess = true
        const { ticketId, messages } = action.payload
        state.messages[ticketId] = messages
      })
      .addCase(getTicketMessages.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
      .addCase(sendMessage.pending, state => {
        state.isLoading = true
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoading = false
        state.isSuccess = true
        const { ticketId, message } = action.payload
        if (!state.messages[ticketId]) {
          state.messages[ticketId] = []
        }
        state.messages[ticketId].push(message)
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
      .addCase(markMessagesAsRead.fulfilled, (state, action) => {
        const ticketId = action.payload
        if (state.messages[ticketId]) {
          state.messages[ticketId].forEach(msg => {
            if (msg.sender._id !== action.meta.arg) {
              msg.read = true
              msg.readAt = new Date().toISOString()
            }
          })
        }
      })
  },
})

export const { reset, addMessage, clearMessages } = messageSlice.actions
export default messageSlice.reducer

