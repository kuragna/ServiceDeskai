import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { login, reset } from '../store/slices/authSlice'
import { toast } from 'react-toastify'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const { email, password } = formData
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const { user, isLoading, isError, isSuccess, message } = useSelector(
    state => state.auth
  )

  useEffect(() => {
    if (isError) {
      toast.error(message)
    }

    if (isSuccess || user) {
      navigate('/dashboard')
    }

    dispatch(reset())
  }, [user, isError, isSuccess, message, navigate, dispatch])

  const onChange = e => {
    setFormData(prevState => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }))
  }

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const onSubmit = e => {
    e.preventDefault()

    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    dispatch(login({ email, password }))
  }

  return (
    <main className="auth-container" id="main-content" role="main">
      <div className="auth-card">
        <h1>Login</h1>
        <p>Sign in to your account</p>

        {isError && (
          <div className="error-message" role="alert" aria-live="assertive">
            {message}
          </div>
        )}

        <form onSubmit={onSubmit} aria-label="Login form" noValidate>
          <div className="form-group">
            <label htmlFor="email">
              Email <span className="required-indicator" aria-label="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={onChange}
              placeholder="Enter your email"
              required
              aria-required="true"
              aria-invalid={isError && !email}
              aria-describedby={isError && !email ? "email-error" : undefined}
              autoComplete="email"
            />
            {isError && !email && (
              <span id="email-error" className="error-text" role="alert">
                Email is required
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password <span className="required-indicator" aria-label="required">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={onChange}
              placeholder="Enter your password"
              required
              aria-required="true"
              aria-invalid={isError && !password}
              aria-describedby={isError && !password ? "password-error" : undefined}
              autoComplete="current-password"
            />
            {isError && !password && (
              <span id="password-error" className="error-text" role="alert">
                Password is required
              </span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            aria-busy={isLoading}
            aria-label={isLoading ? 'Logging in, please wait' : 'Login'}
          >
            {isLoading ? 'Loading...' : 'Login'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register" aria-label="Navigate to registration page">Register</Link>
        </p>
      </div>
    </main>
  )
}

export default Login
