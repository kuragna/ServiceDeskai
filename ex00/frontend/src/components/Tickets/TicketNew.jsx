import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { base_api, fetchProtected, fetchUpload } from '../../api/config';
import { getAllOffices } from '../../store/slices/officeSlice';

export default function TicketNew() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [office, setOffice] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const token = useSelector(state => state.auth.token);
  const { user } = useSelector(state => state.auth);
  const { offices } = useSelector(state => state.offices);

  useEffect(() => {
    dispatch(getAllOffices());
    
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        setUserLocation([position.coords.longitude, position.coords.latitude]);
      },
      err => {
        console.error('Geolocation Error:', err);
        setError('Unable to retrieve your location. Please enable location services.');
      }
    );
  }, [dispatch]);

  useEffect(() => {
    if (user?.preferredOffice && !office) {
      setOffice(user.preferredOffice);
    }
  }, [user, office]);

  const handleMediaChange = e => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      if (!isImage && !isVideo) {
        setError('Please select an image or video file');
        return;
      }
    }
    setMediaFile(file);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!userLocation) {
      setError('Location is required. Please wait for it to be determined.');
      setLoading(false);
      return;
    }

    if (!title || !description) {
      setError('Title and description are required.');
      setLoading(false);
      return;
    }

    const selectedOffice = office || user?.preferredOffice;
    if (!selectedOffice) {
      setError('Please select an office or set a preferred office in your profile.');
      setLoading(false);
      return;
    }

    if (offices.length === 0) {
      setError('No offices available. Please contact an administrator.');
      setLoading(false);
      return;
    }

    try {
      let mediaPath = null;
      let mediaType = null;
      if (mediaFile) {
        const result = await fetchUpload(mediaFile, token);
        mediaPath = result.media_url || result.data?.media_url;
        mediaType = mediaFile.type.startsWith('video/') ? 'video' : 'image';
      }

      const payload = {
        title,
        description,
        office: selectedOffice,
        location: {
          type: 'Point',
          coordinates: userLocation,
          address: 'Current Location',
        },
        ...(mediaPath && { media: [{ url: mediaPath, type: mediaType }] }),
      };

      const response = await fetchProtected(`${base_api}/tickets`, 'POST', token, payload);

      if (response.status === 201) {
        navigate('/tickets/history');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create ticket.');
      }
    } catch (err) {
      console.error('Ticket creation failed:', err);
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Report a New Issue</h2>
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title-input" className="form-label">
            Title *
          </label>
          <input
            type="text"
            id="title-input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Brief description of the issue"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description-input" className="form-label">
            Problem Description <span aria-label="required">*</span>
          </label>
          <textarea
            id="description-input"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the issue in detail."
            rows="5"
            required
            aria-required="true"
          />
        </div>

        <div className="form-group">
          <label htmlFor="office-select" className="form-label">
            Office *
          </label>
          {offices.length === 0 ? (
            <div style={{ padding: '0.75rem', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', color: '#856404' }}>
              No offices available. Please contact an administrator.
            </div>
          ) : (
            <select
              id="office-select"
              value={office || user?.preferredOffice || ''}
              onChange={e => setOffice(e.target.value)}
              required
            >
              <option value="">Select Office</option>
              {offices.map(off => (
                <option key={off._id} value={off._id}>
                  {off.name}
                </option>
              ))}
            </select>
          )}
          {user?.preferredOffice && !office && (
            <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
              Your preferred office will be used if none is selected
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="media-upload" className="form-label">
            Upload Photo/Video (Optional)
          </label>
          <input
            type="file"
            id="media-upload"
            accept="image/*,video/*"
            onChange={handleMediaChange}
            aria-describedby="media-help"
          />
          <small id="media-help" className="form-help-text">
            Supported formats: Images (JPG, PNG, GIF) and videos (MP4, WebM). Maximum size: 10MB
          </small>
          {mediaFile && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Selected: {mediaFile.name} ({(mediaFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Location</label>
          <div className="card" style={{ padding: '1rem' }}>
            {userLocation
              ? `Location captured: Lat ${userLocation[1].toFixed(4)}, Lon ${userLocation[0].toFixed(4)}`
              : 'Fetching location...'}
          </div>
        </div>

        <div className="form-group">
          <button type="submit" className="btn btn-primary" disabled={loading || !userLocation}>
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </form>
    </div>
  );
}
