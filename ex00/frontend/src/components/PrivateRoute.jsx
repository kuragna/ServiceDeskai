import React from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user } = useSelector(state => state.auth)
  
  const storedUser = user || (() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })()

  if (!storedUser) {
    return <Navigate to="/login" />
  }

  if (allowedRoles && !allowedRoles.includes(storedUser.role)) {
    return <Navigate to="/dashboard" />
  }

  return children
}

export default PrivateRoute
