import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

const Dashboard = () => {
  const { user, token } = useSelector(state => state.auth)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const authToken = token || localStorage.getItem('token')
      
      if (!authToken) {
        setLoading(false)
        return
      }

      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
        const response = await fetch(`${apiUrl}/dashboard/stats`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        })

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            window.location.href = '/login'
            return
          }
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || 'Failed to fetch stats')
        }

        const data = await response.json()
        if (data.success && data.data) {
          setStats(data.data.stats)
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
        setStats(null)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchStats()
    } else {
      setLoading(false)
    }
  }, [token, user])

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loader">Loading...</div>
      </div>
    )
  }

  return (
    <main className="dashboard-container" id="main-content" role="main">
      <div className="dashboard-header">
        <h1>Welcome, {user?.name}!</h1>
        <p className="user-role">
          {user?.role.replace('_', ' ').toUpperCase()}
        </p>
      </div>

      <div className="stats-grid">
        {user?.role === 'admin' && stats && (
          <>
            <div className="stat-card">
              <h3>Total Tickets</h3>
              <p className="stat-number">{stats.tickets.total}</p>
            </div>
            <div className="stat-card open">
              <h3>Open Tickets</h3>
              <p className="stat-number">{stats.tickets.open}</p>
            </div>
            <div className="stat-card in-progress">
              <h3>In Progress</h3>
              <p className="stat-number">{stats.tickets.inProgress}</p>
            </div>
            <div className="stat-card closed">
              <h3>Closed Tickets</h3>
              <p className="stat-number">{stats.tickets.closed}</p>
            </div>
            <div className="stat-card">
              <h3>Total Users</h3>
              <p className="stat-number">{stats.users}</p>
            </div>
            <div className="stat-card">
              <h3>Offices</h3>
              <p className="stat-number">{stats.offices}</p>
            </div>
          </>
        )}

        {user?.role === 'service_desk' && stats && (
          <>
            <div className="stat-card">
              <h3>Assigned to Me</h3>
              <p className="stat-number">{stats.assigned}</p>
            </div>
            <div className="stat-card in-progress">
              <h3>In Progress</h3>
              <p className="stat-number">{stats.inProgress}</p>
            </div>
            <div className="stat-card closed">
              <h3>Closed</h3>
              <p className="stat-number">{stats.closed}</p>
            </div>
            <div className="stat-card open">
              <h3>Unassigned</h3>
              <p className="stat-number">{stats.unassigned}</p>
            </div>
          </>
        )}

        {user?.role === 'standard' && stats && (
          <>
            <div className="stat-card">
              <h3>Total Tickets</h3>
              <p className="stat-number">{stats.total}</p>
            </div>
            <div className="stat-card open">
              <h3>Open Tickets</h3>
              <p className="stat-number">{stats.open}</p>
            </div>
            <div className="stat-card closed">
              <h3>Closed Tickets</h3>
              <p className="stat-number">{stats.closed}</p>
            </div>
          </>
        )}
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          {user?.role === 'standard' && (
            <>
              <Link to="/tickets/new" className="action-card" aria-label="Create a new ticket">
                <span className="action-icon" aria-hidden="true">➕</span>
                <h3>Create Ticket</h3>
                <p>Report a new issue</p>
              </Link>
              <Link to="/tickets/history" className="action-card" aria-label="View my tickets">
                <span className="action-icon" aria-hidden="true">📋</span>
                <h3>My Tickets</h3>
                <p>View your reports</p>
              </Link>
            </>
          )}

          {user?.role === 'service_desk' && (
            <Link to="/tickets/history" className="action-card" aria-label="View all tickets">
              <span className="action-icon" aria-hidden="true">🎫</span>
              <h3>View Tickets</h3>
              <p>Manage tickets</p>
            </Link>
          )}

          {user?.role === 'admin' && (
            <>
              <Link to="/tickets/history" className="action-card" aria-label="View all tickets">
                <span className="action-icon" aria-hidden="true">🎫</span>
                <h3>All Tickets</h3>
                <p>View all reports</p>
              </Link>
              <Link to="/admin/users" className="action-card" aria-label="Manage users">
                <span className="action-icon" aria-hidden="true">👥</span>
                <h3>Manage Users</h3>
                <p>Add or view users</p>
              </Link>
              <Link to="/admin/offices" className="action-card" aria-label="Manage offices">
                <span className="action-icon" aria-hidden="true">🏢</span>
                <h3>Manage Offices</h3>
                <p>Add or view offices</p>
              </Link>
            </>
          )}

          <Link to="/profile" className="action-card" aria-label="View profile">
            <span className="action-icon" aria-hidden="true">⚙️</span>
            <h3>Profile</h3>
            <p>Update preferences</p>
          </Link>
        </div>
      </div>
    </main>
  )
}

export default Dashboard
