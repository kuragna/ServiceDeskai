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
  offices: [],
  currentOffice: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
}

export const getAllOffices = createAsyncThunk(
  'offices/getAll',
  async (_, thunkAPI) => {
    try {
      const response = await fetch(`${API_URL}/offices`, getConfig())

      const data = await response.json()

      if (!response.ok) {
        return thunkAPI.rejectWithValue(
          data.message || 'Failed to fetch offices'
        )
      }

      return data.data.offices
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message)
    }
  }
)

export const createOffice = createAsyncThunk(
  'offices/create',
  async (officeData, thunkAPI) => {
    try {
      const response = await fetch(`${API_URL}/offices`, {
        method: 'POST',
        ...getConfig(),
        body: JSON.stringify(officeData),
      })

      const data = await response.json()

      if (!response.ok) {
        return thunkAPI.rejectWithValue(
          data.message || 'Failed to create office'
        )
      }

      return data.data.office
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message)
    }
  }
)

export const officeSlice = createSlice({
  name: 'offices',
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
      .addCase(getAllOffices.pending, state => {
        state.isLoading = true
      })
      .addCase(getAllOffices.fulfilled, (state, action) => {
        state.isLoading = false
        state.offices = action.payload
      })
      .addCase(getAllOffices.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
      .addCase(createOffice.fulfilled, (state, action) => {
        state.isSuccess = true
        state.offices.push(action.payload)
      })
  },
})

export const { reset } = officeSlice.actions
export default officeSlice.reducer
