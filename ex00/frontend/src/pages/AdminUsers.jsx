import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getAllUsers, createUser, reset } from '../store/slices/userSlice'
import { toast } from 'react-toastify'

const AdminUsers = () => {
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'standard',
  })

  const dispatch = useDispatch()
  const { users, isLoading, isSuccess } = useSelector(state => state.users)

  useEffect(() => {
    dispatch(getAllUsers())
  }, [dispatch])

  useEffect(() => {
    if (isSuccess) {
      toast.success('User created successfully!')
      setShowModal(false)
      setFormData({ name: '', email: '', password: '', role: 'standard' })
      dispatch(reset())
    }
  }, [isSuccess, dispatch])

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

    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all fields')
      return
    }

    if (!validateEmail(formData.email)) {
      toast.error('Please enter a valid email address')
      return
    }

    dispatch(createUser(formData))
  }

  if (isLoading && users.length === 0) {
    return (
      <div className="admin-users-container">
        <div className="loader">Loading...</div>
      </div>
    )
  }

  return (
    <main className="admin-users-container" id="main-content" role="main">
      <div className="admin-header">
        <h1>Users Management</h1>
        <button 
          onClick={() => setShowModal(true)} 
          className="btn btn-primary"
          aria-label="Open form to create a new user"
        >
          + Add New User
        </button>
      </div>

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Preferred Office</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge role-${user.role}`}>
                    {user.role.replace('_', ' ')}
                  </span>
                </td>
                <td>{user.preferredOffice?.name || '-'}</td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title-user"
        >
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button 
              className="modal-close" 
              onClick={() => setShowModal(false)}
              aria-label="Close create user form"
            >
              ×
            </button>

            <h2 id="modal-title-user">Create New User</h2>

            <form onSubmit={onSubmit} aria-label="Create new user form" noValidate>
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={onChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={onChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={onChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">Role *</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={onChange}
                  required
                >
                  <option value="standard">Standard User</option>
                  <option value="service_desk">Service Desk</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary">
                Create User
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

export default AdminUsers
