import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getAllOffices, createOffice, reset } from '../store/slices/officeSlice'
import { toast } from 'react-toastify'

const AdminOffices = () => {
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    country: '',
    latitude: '',
    longitude: '',
  })

  const dispatch = useDispatch()
  const { offices, isLoading, isSuccess } = useSelector(state => state.offices)

  useEffect(() => {
    dispatch(getAllOffices())
  }, [dispatch])

  useEffect(() => {
    if (isSuccess) {
      toast.success('Office created successfully!')
      setShowModal(false)
      setFormData({
        name: '',
        address: '',
        city: '',
        country: '',
        latitude: '',
        longitude: '',
      })
      dispatch(reset())
    }
  }, [isSuccess, dispatch])

  const onChange = e => {
    setFormData(prevState => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }))
  }

  const getMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          }))
          toast.success('Location captured!')
        },
        error => {
          toast.error('Failed to get location')
        }
      )
    }
  }

  const onSubmit = e => {
    e.preventDefault()

    if (
      !formData.name ||
      !formData.address ||
      !formData.city ||
      !formData.country ||
      !formData.latitude ||
      !formData.longitude
    ) {
      toast.error('Please fill in all fields')
      return
    }

    const officeData = {
      name: formData.name,
      address: formData.address,
      city: formData.city,
      country: formData.country,
      location: {
        coordinates: [
          parseFloat(formData.longitude),
          parseFloat(formData.latitude),
        ],
      },
    }

    dispatch(createOffice(officeData))
  }

  if (isLoading && offices.length === 0) {
    return (
      <div className="admin-offices-container">
        <div className="loader">Loading...</div>
      </div>
    )
  }

  return (
    <main className="admin-offices-container" id="main-content" role="main">
      <div className="admin-header">
        <h1>Offices Management</h1>
        <button 
          onClick={() => setShowModal(true)} 
          className="btn btn-primary"
          aria-label="Open form to create a new office"
        >
          + Add New Office
        </button>
      </div>

      <div className="offices-grid">
        {offices.map(office => (
          <div key={office._id} className="office-card">
            <h3>{office.name}</h3>
            <p className="office-address">{office.address}</p>
            <p>
              {office.city}, {office.country}
            </p>
            <div className="office-location">
              <small>
                📍 {office.location.coordinates[1].toFixed(6)},{' '}
                {office.location.coordinates[0].toFixed(6)}
              </small>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title-office"
        >
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button 
              className="modal-close" 
              onClick={() => setShowModal(false)}
              aria-label="Close create office form"
            >
              ×
            </button>

            <h2 id="modal-title-office">Create New Office</h2>

            <form onSubmit={onSubmit} aria-label="Create new office form" noValidate>
              <div className="form-group">
                <label htmlFor="name">Office Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={onChange}
                  placeholder="e.g., Madrid Office"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="address">Address *</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={onChange}
                  placeholder="Street address"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">City *</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={onChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="country">Country *</label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={onChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="latitude">Latitude *</label>
                  <input
                    type="number"
                    step="any"
                    id="latitude"
                    name="latitude"
                    value={formData.latitude}
                    onChange={onChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="longitude">Longitude *</label>
                  <input
                    type="number"
                    step="any"
                    id="longitude"
                    name="longitude"
                    value={formData.longitude}
                    onChange={onChange}
                    required
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={getMyLocation}
                className="btn btn-secondary"
                aria-label="Capture current location for office coordinates"
              >
                📍 Use My Location
              </button>

              <button type="submit" className="btn btn-primary">
                Create Office
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

export default AdminOffices
