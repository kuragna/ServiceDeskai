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
  tickets: [],
  currentTicket: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
}

export const createTicket = createAsyncThunk(
  'tickets/create',
  async (ticketData, thunkAPI) => {
    try {
      const response = await fetch(`${API_URL}/tickets`, {
        method: 'POST',
        ...getConfig(),
        body: JSON.stringify(ticketData),
      })

      const data = await response.json()

      if (!response.ok) {
        if (handleAuthError(response)) {
          return thunkAPI.rejectWithValue('Session expired. Please log in again.')
        }
        return thunkAPI.rejectWithValue(
          data.message || 'Failed to create ticket'
        )
      }

      return data.data.ticket
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message)
    }
  }
)

export const getMyTickets = createAsyncThunk(
  'tickets/getMy',
  async (status, thunkAPI) => {
    try {
      const url = status
        ? `${API_URL}/tickets/history?status=${status}`
        : `${API_URL}/tickets/history`
      const response = await fetch(url, getConfig())

      const data = await response.json()

      if (!response.ok) {
        if (handleAuthError(response)) {
          return thunkAPI.rejectWithValue('Session expired. Please log in again.')
        }
        return thunkAPI.rejectWithValue(
          data.message || 'Failed to fetch tickets'
        )
      }

      return data.data.tickets
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message)
    }
  }
)

export const getAllTickets = createAsyncThunk(
  'tickets/getAll',
  async (filters, thunkAPI) => {
    try {
      let url = `${API_URL}/tickets`
      if (filters) {
        const params = new URLSearchParams(filters).toString()
        url += `?${params}`
      }
      const response = await fetch(url, getConfig())

      const data = await response.json()

      if (!response.ok) {
        if (handleAuthError(response)) {
          return thunkAPI.rejectWithValue('Session expired. Please log in again.')
        }
        return thunkAPI.rejectWithValue(
          data.message || 'Failed to fetch tickets'
        )
      }

      return data.data.tickets
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message)
    }
  }
)

export const assignTicket = createAsyncThunk(
  'tickets/assign',
  async ({ ticketId, userId }, thunkAPI) => {
    try {
      const body = userId ? { userId } : {}
      const response = await fetch(`${API_URL}/tickets/${ticketId}/assign`, {
        method: 'PATCH',
        ...getConfig(),
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        if (handleAuthError(response)) {
          return thunkAPI.rejectWithValue('Session expired. Please log in again.')
        }
        return thunkAPI.rejectWithValue(
          data.message || 'Failed to assign ticket'
        )
      }

      return data.data.ticket
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message)
    }
  }
)

export const updateTicketStatus = createAsyncThunk(
  'tickets/updateStatus',
  async ({ ticketId, status }, thunkAPI) => {
    try {
      const response = await fetch(`${API_URL}/tickets/${ticketId}/status`, {
        method: 'PATCH',
        ...getConfig(),
        body: JSON.stringify({ status }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (handleAuthError(response)) {
          return thunkAPI.rejectWithValue('Session expired. Please log in again.')
        }
        return thunkAPI.rejectWithValue(
          data.message || 'Failed to update ticket status'
        )
      }

      return data.data.ticket
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message)
    }
  }
)

export const ticketSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    reset: state => {
      state.isLoading = false
      state.isSuccess = false
      state.isError = false
      state.message = ''
    },
    setCurrentTicket: (state, action) => {
      state.currentTicket = action.payload
    },
  },
  extraReducers: builder => {
    builder
      .addCase(createTicket.pending, state => {
        state.isLoading = true
      })
      .addCase(createTicket.fulfilled, (state, action) => {
        state.isLoading = false
        state.isSuccess = true
        state.tickets.unshift(action.payload)
      })
      .addCase(createTicket.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
      .addCase(getMyTickets.pending, state => {
        state.isLoading = true
      })
      .addCase(getMyTickets.fulfilled, (state, action) => {
        state.isLoading = false
        state.tickets = action.payload
      })
      .addCase(getMyTickets.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
      .addCase(getAllTickets.fulfilled, (state, action) => {
        state.isLoading = false
        state.tickets = action.payload
      })
      .addCase(assignTicket.fulfilled, (state, action) => {
        state.isSuccess = true
        const index = state.tickets.findIndex(t => t._id === action.payload._id)
        if (index !== -1) {
          state.tickets[index] = action.payload
        }
      })
      .addCase(updateTicketStatus.fulfilled, (state, action) => {
        state.isSuccess = true
        const index = state.tickets.findIndex(t => t._id === action.payload._id)
        if (index !== -1) {
          state.tickets[index] = action.payload
        }
      })
  },
})

export const { reset, setCurrentTicket } = ticketSlice.actions
export default ticketSlice.reducer
