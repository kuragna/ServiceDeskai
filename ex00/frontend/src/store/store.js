import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import ticketReducer from './slices/ticketSlice'
import userReducer from './slices/userSlice'
import officeReducer from './slices/officeSlice'
import messageReducer from './slices/messageSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tickets: ticketReducer,
    users: userReducer,
    offices: officeReducer,
    messages: messageReducer,
  },
})
