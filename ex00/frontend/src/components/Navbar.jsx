import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../store/slices/authSlice'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector(state => state.auth)
  const menuRef = useRef(null)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
    setIsOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-logo" aria-label="ServiceDeskai Home">
          ServiceDesk<span>AI</span>
        </Link>

        <button 
          className="navbar-toggle" 
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
          aria-controls="navbar-menu"
        >
          {isOpen ? '✕' : '☰'}
        </button>

        <ul 
          id="navbar-menu"
          ref={menuRef}
          className={`navbar-menu ${isOpen ? 'active' : ''}`}
          role="menubar"
        >
          <li>
            <Link to="/dashboard" onClick={() => setIsOpen(false)}>
              Dashboard
            </Link>
          </li>

          {user?.role === 'standard' && (
            <>
              <li>
                <Link to="/tickets/new" onClick={() => setIsOpen(false)}>
                  New Ticket
                </Link>
              </li>
              <li>
                <Link to="/tickets/history" onClick={() => setIsOpen(false)}>
                  My Tickets
                </Link>
              </li>
            </>
          )}

          {user?.role === 'service_desk' && (
            <li>
              <Link to="/tickets/history" onClick={() => setIsOpen(false)}>
                Tickets
              </Link>
            </li>
          )}

          {user?.role === 'admin' && (
            <>
              <li>
                <Link to="/tickets/history" onClick={() => setIsOpen(false)}>
                  All Tickets
                </Link>
              </li>
              <li>
                <Link to="/admin/users" onClick={() => setIsOpen(false)}>
                  Users
                </Link>
              </li>
              <li>
                <Link to="/admin/offices" onClick={() => setIsOpen(false)}>
                  Offices
                </Link>
              </li>
            </>
          )}

          <li>
            <Link to="/profile" onClick={() => setIsOpen(false)}>
              Profile
            </Link>
          </li>
          <li>
            <button 
              onClick={handleLogout} 
              className="logout-btn"
              aria-label="Logout"
            >
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  )
}

export default Navbar
