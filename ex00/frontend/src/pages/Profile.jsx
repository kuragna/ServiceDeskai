import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getMyProfile, updateMyProfile, updatePassword, reset } from '../store/slices/userSlice'
import { getAllOffices } from '../store/slices/officeSlice'
import { toast } from 'react-toastify'

const Profile = () => {
  const [formData, setFormData] = useState({
    name: '',
    preferredOffice: '',
    preferredWorkstation: '',
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [passwordErrors, setPasswordErrors] = useState({})
  const [showPasswordForm, setShowPasswordForm] = useState(false)

  const dispatch = useDispatch()
  const { profile, isLoading, isSuccess } = useSelector(state => state.users)
  const { offices } = useSelector(state => state.offices)
  const { user } = useSelector(state => state.auth)

  useEffect(() => {
    dispatch(getMyProfile())
    dispatch(getAllOffices())
  }, [dispatch])

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        preferredOffice: profile.preferredOffice?._id || '',
        preferredWorkstation: profile.preferredWorkstation || '',
      })
    }
  }, [profile])

  useEffect(() => {
    if (isSuccess) {
      toast.success('Profile updated successfully!')
      dispatch(reset())
    }
  }, [isSuccess, dispatch])

  const onChange = e => {
    setFormData(prevState => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }))
  }

  const onPasswordChange = e => {
    setPasswordData(prevState => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }))
    if (passwordErrors[e.target.name]) {
      setPasswordErrors(prev => ({ ...prev, [e.target.name]: '' }))
    }
  }

  const validatePasswordForm = () => {
    const newErrors = {}
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required'
    }
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required'
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters'
    }
    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password'
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    setPasswordErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const onSubmit = e => {
    e.preventDefault()

    const updateData = {
      name: formData.name,
      preferredOffice: formData.preferredOffice,
      preferredWorkstation: formData.preferredWorkstation,
    }

    dispatch(updateMyProfile(updateData))
  }

  const onPasswordSubmit = async e => {
    e.preventDefault()

    if (!validatePasswordForm()) {
      return
    }

    try {
      await dispatch(updatePassword(passwordData)).unwrap()
      toast.success('Password updated successfully!')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setShowPasswordForm(false)
      setPasswordErrors({})
      dispatch(reset())
    } catch (error) {
      toast.error(error || 'Failed to update password')
    }
  }

  if (isLoading && !profile) {
    return (
      <div className="profile-container">
        <div className="loader">Loading...</div>
      </div>
    )
  }

  return (
    <main className="profile-container" id="main-content" role="main">
      <div className="profile-card">
        <h1>My Profile</h1>

        <div className="profile-info">
          <div className="info-item">
            <strong>Email:</strong>
            <span>{user?.email}</span>
          </div>
          <div className="info-item">
            <strong>Role:</strong>
            <span className="role-badge">
              {user?.role.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>

        <form onSubmit={onSubmit} aria-label="Update profile form" noValidate>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
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
            <label htmlFor="preferredOffice">Preferred Office</label>
            <select
              id="preferredOffice"
              name="preferredOffice"
              value={formData.preferredOffice}
              onChange={onChange}
            >
              <option value="">Select Office</option>
              {offices.map(office => (
                <option key={office._id} value={office._id}>
                  {office.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="preferredWorkstation">Preferred Workstation</label>
            <input
              type="text"
              id="preferredWorkstation"
              name="preferredWorkstation"
              value={formData.preferredWorkstation}
              onChange={onChange}
              placeholder="e.g., Desk 42"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            aria-label="Save profile changes"
          >
            Update Profile
          </button>
        </form>

        <div className="password-section" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
          <h2>Change Password</h2>
          
          {!showPasswordForm ? (
            <button
              type="button"
              onClick={() => setShowPasswordForm(true)}
              className="btn btn-secondary"
              aria-label="Open password change form"
            >
              Change Password
            </button>
          ) : (
            <form onSubmit={onPasswordSubmit} aria-label="Change password form" noValidate>
              <div className="form-group">
                <label htmlFor="currentPassword">
                  Current Password <span className="required-indicator" aria-label="required">*</span>
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={onPasswordChange}
                  placeholder="Enter your current password"
                  required
                  aria-required="true"
                  aria-invalid={!!passwordErrors.currentPassword}
                  aria-describedby={passwordErrors.currentPassword ? "currentPassword-error" : undefined}
                  autoComplete="current-password"
                />
                {passwordErrors.currentPassword && (
                  <span id="currentPassword-error" className="error-text" role="alert">
                    {passwordErrors.currentPassword}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">
                  New Password <span className="required-indicator" aria-label="required">*</span>
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={onPasswordChange}
                  placeholder="Enter your new password (minimum 6 characters)"
                  required
                  aria-required="true"
                  aria-invalid={!!passwordErrors.newPassword}
                  aria-describedby={passwordErrors.newPassword ? "newPassword-error" : "newPassword-help"}
                  autoComplete="new-password"
                />
                {passwordErrors.newPassword ? (
                  <span id="newPassword-error" className="error-text" role="alert">
                    {passwordErrors.newPassword}
                  </span>
                ) : (
                  <small id="newPassword-help" className="form-help-text">
                    Password must be at least 6 characters long
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">
                  Confirm New Password <span className="required-indicator" aria-label="required">*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={onPasswordChange}
                  placeholder="Confirm your new password"
                  required
                  aria-required="true"
                  aria-invalid={!!passwordErrors.confirmPassword}
                  aria-describedby={passwordErrors.confirmPassword ? "confirmPassword-error" : undefined}
                  autoComplete="new-password"
                />
                {passwordErrors.confirmPassword && (
                  <span id="confirmPassword-error" className="error-text" role="alert">
                    {passwordErrors.confirmPassword}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                  aria-busy={isLoading}
                  aria-label={isLoading ? 'Updating password, please wait' : 'Update password'}
                >
                  {isLoading ? 'Updating...' : 'Update Password'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false)
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    })
                    setPasswordErrors({})
                  }}
                  className="btn btn-secondary"
                  aria-label="Cancel password change"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}

export default Profile
