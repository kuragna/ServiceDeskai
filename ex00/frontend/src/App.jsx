import React, { useEffect } from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { syncFromStorage } from './store/slices/authSlice'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import CreateTicket from './pages/CreateTicket'
import TicketHistory from './pages/TicketHistory'
import Profile from './pages/Profile'
import AdminUsers from './pages/AdminUsers'
import AdminOffices from './pages/AdminOffices'

import Navbar from './components/Navbar'
import PrivateRoute from './components/PrivateRoute'

import './App.css'

function App() {
  const dispatch = useDispatch()
  const { user } = useSelector(state => state.auth)

  useEffect(() => {
    dispatch(syncFromStorage())
  }, [dispatch])

  return (
    <Router>
      <div className="App">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {user && <Navbar />}
        <ToastContainer 
          position="top-right" 
          autoClose={3000}
          role="alert"
          aria-live="polite"
        />
        <div id="aria-live-region" aria-live="polite" aria-atomic="true" className="sr-only"></div>

        <Routes>
          <Route
            path="/login"
            element={!user ? <Login /> : <Navigate to="/dashboard" />}
          />
          <Route
            path="/register"
            element={!user ? <Register /> : <Navigate to="/dashboard" />}
          />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/tickets/new"
            element={
              <PrivateRoute>
                <CreateTicket />
              </PrivateRoute>
            }
          />
          <Route
            path="/tickets/history"
            element={
              <PrivateRoute>
                <TicketHistory />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminUsers />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/offices"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminOffices />
              </PrivateRoute>
            }
          />

          <Route
            path="/"
            element={<Navigate to={user ? '/dashboard' : '/login'} />}
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
