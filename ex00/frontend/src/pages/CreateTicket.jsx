import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { createTicket, reset } from '../store/slices/ticketSlice'
import { getAllOffices } from '../store/slices/officeSlice'
import { toast } from 'react-toastify'
import { fetchUpload } from '../api/config'

const CreateTicket = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    office: '',
    workstation: '',
    priority: 'medium',
  })

  const [selectedFile, setSelectedFile] = useState(null)
  const [mediaPreview, setMediaPreview] = useState(null)
  const [mediaType, setMediaType] = useState(null)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const fileInputRef = useRef(null)
  const [location, setLocation] = useState(null)
  const [gettingLocation, setGettingLocation] = useState(false)

  const navigate = useNavigate()
  const dispatch = useDispatch()

  const { isLoading, isSuccess, isError, message } = useSelector(
    state => state.tickets
  )
  const { offices } = useSelector(state => state.offices)
  const { user, token } = useSelector(state => state.auth)

  useEffect(() => {
    dispatch(getAllOffices())
  }, [dispatch])

  useEffect(() => {
    if (isSuccess) {
      toast.success('Ticket created successfully!')
      navigate('/tickets/history')
    }

    if (isError) {
      toast.error(message)
    }

    dispatch(reset())
  }, [isSuccess, isError, message, navigate, dispatch])

  const getLocation = () => {
    setGettingLocation(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setLocation({
            coordinates: [position.coords.longitude, position.coords.latitude],
            address: 'Current Location',
          })
          setGettingLocation(false)
          toast.success('Location captured!')
        },
        error => {
          console.error('Error getting location:', error)
          toast.error(
            'Failed to get location. Please enable location services.'
          )
          setGettingLocation(false)
        }
      )
    } else {
      toast.error('Geolocation is not supported by this browser.')
      setGettingLocation(false)
    }
  }

  const onChange = e => {
    setFormData(prevState => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) {
      setSelectedFile(null)
      setMediaPreview(null)
      setMediaType(null)
      return
    }

    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    
    if (!isImage && !isVideo) {
      toast.error('Please select an image or video file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    setSelectedFile(file)
    setMediaType(isImage ? 'image' : 'video')

    const reader = new FileReader()
    reader.onloadend = () => {
      setMediaPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveMedia = () => {
    setSelectedFile(null)
    setMediaPreview(null)
    setMediaType(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()

    if (!location) {
      toast.error('Please capture your location')
      return
    }

    const selectedOffice = formData.office || user?.preferredOffice
    if (!selectedOffice) {
      toast.error('Please select an office or set a preferred office in your profile')
      return
    }

    if (offices.length === 0) {
      toast.error('No offices available. Please contact an administrator to create an office.')
      return
    }

    let mediaUrl = null

    if (selectedFile) {
      setUploadingMedia(true)
      try {
        const authToken = token || localStorage.getItem('token')
        if (!authToken) {
          toast.error('Authentication required. Please log in again.')
          setUploadingMedia(false)
          return
        }
        const uploadResponse = await fetchUpload(selectedFile, authToken)
        if (uploadResponse.success && uploadResponse.data?.media_url) {
          mediaUrl = uploadResponse.data.media_url
        } else if (uploadResponse.media_url) {
          mediaUrl = uploadResponse.media_url
        } else {
          toast.error('Failed to upload media. Please try again.')
          setUploadingMedia(false)
          return
        }
      } catch (error) {
        console.error('Media upload error:', error)
        toast.error('Failed to upload media. Please try again.')
        setUploadingMedia(false)
        return
      }
      setUploadingMedia(false)
    }

    const ticketData = {
      title: formData.title,
      description: formData.description,
      office: selectedOffice,
      workstation: formData.workstation || user?.preferredWorkstation || '',
      priority: formData.priority,
      location,
      media: mediaUrl ? [{ url: mediaUrl, type: mediaType || 'image' }] : [],
    }

    dispatch(createTicket(ticketData))
  }

  return (
    <main className="create-ticket-container" id="main-content" role="main">
      <div className="create-ticket-card">
        <h1>Create New Ticket</h1>

        <form onSubmit={onSubmit} aria-label="Create ticket form" noValidate>
          <div className="form-group">
            <label htmlFor="title">
              Title <span aria-label="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={onChange}
              placeholder="Brief description of the issue"
              required
              aria-required="true"
              aria-describedby="title-help"
            />
            <small id="title-help" className="form-help-text">
              Provide a brief, descriptive title for your ticket
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Description <span aria-label="required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={onChange}
              placeholder="Detailed description of the issue"
              rows="4"
              required
              aria-required="true"
              aria-describedby="description-help"
            />
            <small id="description-help" className="form-help-text">
              Provide detailed information about the problem
            </small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="office">Office *</label>
              {offices.length === 0 ? (
                <div style={{ padding: '0.75rem', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', color: '#856404' }}>
                  No offices available. Please contact an administrator.
                </div>
              ) : (
                <select
                  id="office"
                  name="office"
                  value={formData.office || user?.preferredOffice || ''}
                  onChange={onChange}
                  required
                >
                  <option value="">Select Office</option>
                  {offices.map(office => (
                    <option key={office._id} value={office._id}>
                      {office.name}
                    </option>
                  ))}
                </select>
              )}
              {user?.preferredOffice && !formData.office && (
                <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
                  Your preferred office will be used if none is selected
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="workstation">Workstation</label>
              <input
                type="text"
                id="workstation"
                name="workstation"
                value={formData.workstation}
                onChange={onChange}
                placeholder="e.g., Desk 42"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={onChange}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="mediaFile">
              Photo/Video (Optional)
            </label>
            <input
              type="file"
              id="mediaFile"
              name="mediaFile"
              ref={fileInputRef}
              accept="image/*,video/*"
              onChange={handleFileChange}
              aria-describedby="media-help"
              aria-label="Select an image or video file to upload"
            />
            <small id="media-help" className="form-help-text">
              Upload an image (JPG, PNG, GIF) or video (MP4, WebM). Maximum size: 10MB
            </small>
            {mediaPreview && (
              <div className="media-preview-container" style={{ marginTop: '1rem' }}>
                {mediaType === 'image' ? (
                  <img
                    src={mediaPreview}
                    alt="Preview of selected media"
                    className="media-preview"
                    style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                    aria-label="Image preview"
                  />
                ) : (
                  <video
                    src={mediaPreview}
                    controls
                    className="media-preview"
                    style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                    aria-label="Video preview"
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
                <button
                  type="button"
                  onClick={handleRemoveMedia}
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '0.5rem' }}
                  aria-label="Remove selected media"
                >
                  Remove {mediaType === 'image' ? 'Image' : 'Video'}
                </button>
              </div>
            )}
          </div>

          <div className="location-section">
            <button
              type="button"
              onClick={getLocation}
              className="btn btn-secondary"
              disabled={gettingLocation}
              aria-busy={gettingLocation}
              aria-label={gettingLocation ? 'Getting your location, please wait' : location ? 'Location captured, click to update' : 'Capture your current location'}
            >
              {gettingLocation
                ? 'Getting Location...'
                : location
                  ? '✓ Location Captured'
                  : '📍 Capture Location'}
            </button>
            {location && (
              <p className="location-info" role="status" aria-live="polite">
                Coordinates: {location.coordinates[1].toFixed(6)},{' '}
                {location.coordinates[0].toFixed(6)}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || uploadingMedia}
            aria-busy={isLoading || uploadingMedia}
            aria-label={isLoading || uploadingMedia ? 'Creating ticket, please wait' : 'Create ticket'}
          >
            {uploadingMedia ? 'Uploading Media...' : isLoading ? 'Creating...' : 'Create Ticket'}
          </button>
        </form>
      </div>
    </main>
  )
}

export default CreateTicket
