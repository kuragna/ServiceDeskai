import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const getConfig = () => {
  const token = localStorage.getItem('token')
  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  }
}

const initialState = {
  users: [],
  profile: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
}

export const getMyProfile = createAsyncThunk(
  'users/getProfile',
  async (_, thunkAPI) => {
    try {
      const response = await fetch(`${API_URL}/users/me`, getConfig())

      const data = await response.json()

      if (!response.ok) {
        return thunkAPI.rejectWithValue(
          data.message || 'Failed to fetch profile'
        )
      }

      return data.data.user
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message)
    }
  }
)

export const updateMyProfile = createAsyncThunk(
  'users/updateProfile',
  async (userData, thunkAPI) => {
    try {
      const response = await fetch(`${API_URL}/users/me`, {
        method: 'PATCH',
        ...getConfig(),
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (!response.ok) {
        return thunkAPI.rejectWithValue(
          data.message || 'Failed to update profile'
        )
      }

      return data.data.user
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message)
    }
  }
)

export const getAllUsers = createAsyncThunk(
  'users/getAll',
  async (_, thunkAPI) => {
    try {
      const response = await fetch(`${API_URL}/users`, getConfig())

      const data = await response.json()

      if (!response.ok) {
        return thunkAPI.rejectWithValue(data.message || 'Failed to fetch users')
      }

      return data.data.users
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message)
    }
  }
)

export const updatePassword = createAsyncThunk(
  'users/updatePassword',
  async (passwordData, thunkAPI) => {
    try {
      const response = await fetch(`${API_URL}/users/me/password`, {
        method: 'PATCH',
        ...getConfig(),
        body: JSON.stringify(passwordData),
      })

      const data = await response.json()

      if (!response.ok) {
        return thunkAPI.rejectWithValue(
          data.message || 'Failed to update password'
        )
      }

      return data
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message)
    }
  }
)

export const createUser = createAsyncThunk(
  'users/create',
  async (userData, thunkAPI) => {
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        ...getConfig(),
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (!response.ok) {
        return thunkAPI.rejectWithValue(data.message || 'Failed to create user')
      }

      return data.data.user
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message)
    }
  }
)

export const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    reset: state => {
      state.isLoading = false
      state.isSuccess = false
      state.isError = false
      state.message = ''
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getMyProfile.pending, state => {
        state.isLoading = true
      })
      .addCase(getMyProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.profile = action.payload
      })
      .addCase(getMyProfile.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
      .addCase(updateMyProfile.fulfilled, (state, action) => {
        state.isSuccess = true
        state.profile = action.payload
      })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.users = action.payload
      })
      .addCase(updatePassword.pending, state => {
        state.isLoading = true
      })
      .addCase(updatePassword.fulfilled, state => {
        state.isLoading = false
        state.isSuccess = true
        state.message = 'Password updated successfully'
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.isSuccess = true
        state.users.push(action.payload)
      })
  },
})

export const { reset } = userSlice.actions
export default userSlice.reducer
