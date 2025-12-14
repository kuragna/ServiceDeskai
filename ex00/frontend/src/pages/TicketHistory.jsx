import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  getMyTickets,
  getAllTickets,
  assignTicket,
  updateTicketStatus,
  reset,
} from '../store/slices/ticketSlice'
import { getAllUsers } from '../store/slices/userSlice'
import { toast } from 'react-toastify'
import { shareTicketViaEmail, copyTicketToClipboard } from '../utils/shareTicket'
import Chat from '../components/Chat'

const TicketHistory = () => {
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [assigningTo, setAssigningTo] = useState({})

  const dispatch = useDispatch()
  const { tickets, isLoading, isSuccess, isError, message } = useSelector(
    state => state.tickets
  )
  const { user } = useSelector(state => state.auth)
  const { users } = useSelector(state => state.users)

  useEffect(() => {
    if (user.role === 'admin' || user.role === 'service_desk') {
      dispatch(getAllTickets())
      if (user.role === 'admin') {
        dispatch(getAllUsers())
      }
    } else {
      dispatch(getMyTickets())
    }
  }, [dispatch, user.role])

  useEffect(() => {
    if (selectedTicket && tickets.length > 0) {
      const updatedTicket = tickets.find(t => t._id === selectedTicket._id)
      if (updatedTicket) {
        setSelectedTicket(updatedTicket)
      }
    }
  }, [tickets])

  useEffect(() => {
    if (isSuccess) {
      toast.success('Action completed successfully')
      dispatch(reset())
      if (user.role === 'admin' || user.role === 'service_desk') {
        dispatch(getAllTickets()).then((result) => {
          if (selectedTicket && result.payload) {
            const updatedTicket = result.payload.find(t => t._id === selectedTicket._id)
            if (updatedTicket) {
              setSelectedTicket(updatedTicket)
            }
          }
        })
      } else {
        dispatch(getMyTickets()).then((result) => {
          if (selectedTicket && result.payload) {
            const updatedTicket = result.payload.find(t => t._id === selectedTicket._id)
            if (updatedTicket) {
              setSelectedTicket(updatedTicket)
            }
          }
        })
      }
    }

    if (isError) {
      toast.error(message)
      dispatch(reset())
    }
  }, [isSuccess, isError, message, dispatch, user.role, selectedTicket])

  const handleAssign = (ticketId, userId = null) => {
    if (userId) {
      dispatch(assignTicket({ ticketId, userId }))
    } else {
      if (window.confirm('Assign this ticket to yourself?')) {
        dispatch(assignTicket({ ticketId }))
      }
    }
    setAssigningTo({})
  }

  const serviceDeskUsers = users.filter(u => u.role === 'service_desk')

  const handleStatusChange = (ticketId, newStatus) => {
    dispatch(updateTicketStatus({ ticketId, status: newStatus }))
  }

  const handleShareEmail = (ticket) => {
    try {
      const success = shareTicketViaEmail(ticket)
      if (success) {
        toast.success('Opening email client with ticket details...')
      } else {
        toast.error('Failed to open email client. Please try again.')
      }
    } catch (error) {
      console.error('Error sharing ticket:', error)
      toast.error('An error occurred while sharing the ticket.')
    }
  }

  const handleCopyToClipboard = async (ticket) => {
    const success = await copyTicketToClipboard(ticket)
    if (success) {
      toast.success('Ticket details copied to clipboard!')
    } else {
      toast.error('Failed to copy to clipboard')
    }
  }

  const getStatusBadge = status => {
    const badges = {
      open: 'badge-open',
      assigned: 'badge-assigned',
      'in-progress': 'badge-in-progress',
      closed: 'badge-closed',
    }
    return badges[status] || 'badge-default'
  }

  const getPriorityBadge = priority => {
    const badges = {
      low: 'badge-low',
      medium: 'badge-medium',
      high: 'badge-high',
      critical: 'badge-critical',
    }
    return badges[priority] || 'badge-default'
  }

  const filteredTickets = statusFilter
    ? tickets.filter(ticket => ticket.status === statusFilter)
    : tickets

  if (isLoading) {
    return (
      <div className="ticket-history-container">
        <div className="loader">Loading...</div>
      </div>
    )
  }

  return (
    <main className="ticket-history-container" id="main-content" role="main">
      <div className="ticket-history-header">
        <h1>{user.role === 'admin' ? 'All Tickets' : 'My Tickets'}</h1>

        <div className="filters">
          <label htmlFor="status-filter" className="sr-only">
            Filter tickets by status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            aria-label="Filter tickets by status"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="assigned">Assigned</option>
            <option value="in-progress">In Progress</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="tickets-grid">
        {filteredTickets.length === 0 ? (
          <p className="no-tickets">No tickets found</p>
        ) : (
          filteredTickets.map(ticket => (
            <div key={ticket._id} className="ticket-card">
              <div className="ticket-header">
                <h3>{ticket.title}</h3>
                <div className="ticket-badges">
                  <span className={`badge ${getStatusBadge(ticket.status)}`}>
                    {ticket.status}
                  </span>
                  <span
                    className={`badge ${getPriorityBadge(ticket.priority)}`}
                  >
                    {ticket.priority}
                  </span>
                </div>
              </div>

              <p className="ticket-description">{ticket.description}</p>

              <div className="ticket-info">
                <p>
                  <strong>Office:</strong> {ticket.office?.name}
                </p>
                {ticket.workstation && (
                  <p>
                    <strong>Workstation:</strong> {ticket.workstation}
                  </p>
                )}
                {ticket.reporter && (
                  <p>
                    <strong>Reporter:</strong> {ticket.reporter.name}
                  </p>
                )}
                {ticket.assignedTo && (
                  <p>
                    <strong>Assigned to:</strong> {ticket.assignedTo.name}
                  </p>
                )}
                <p>
                  <strong>Created:</strong>{' '}
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </p>
              </div>

              {ticket.media && ticket.media.length > 0 && (
                <div className="ticket-media">
                  {ticket.media[0].type === 'video' || ticket.media[0].url.startsWith('data:video/') ? (
                    <video
                      src={ticket.media[0].url}
                      controls
                      style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }}
                      aria-label={`Video attachment for ticket ${ticket.title || ticket._id.slice(-6)}`}
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <img 
                      src={ticket.media[0].url} 
                      alt={`Media attachment for ticket ${ticket.title || ticket._id.slice(-6)}`}
                      loading="lazy"
                      style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }}
                    />
                  )}
                </div>
              )}

              {ticket.aiAnalysis && (
                <div className="ai-analysis">
                  <p>
                    <strong>AI Analysis:</strong>{' '}
                    {ticket.aiAnalysis.description}
                  </p>
                </div>
              )}

              {(user.role === 'service_desk' || user.role === 'admin') && (
                <div className="ticket-actions">
                  {!ticket.assignedTo && (
                    <>
                      {user.role === 'service_desk' && (
                        <button
                          onClick={() => handleAssign(ticket._id)}
                          className="btn btn-secondary btn-sm"
                          aria-label="Assign this ticket to yourself"
                        >
                          Assign to Me
                        </button>
                      )}
                      {user.role === 'admin' && serviceDeskUsers.length > 0 && (
                        <div className="assign-dropdown">
                          <label htmlFor={`assign-${ticket._id}`} className="sr-only">
                            Assign ticket to service desk user
                          </label>
                          <select
                            id={`assign-${ticket._id}`}
                            value={assigningTo[ticket._id] || ''}
                            onChange={e => {
                              const selectedUserId = e.target.value
                              if (selectedUserId) {
                                setAssigningTo({ ...assigningTo, [ticket._id]: selectedUserId })
                                handleAssign(ticket._id, selectedUserId)
                              }
                            }}
                            className="status-select"
                            aria-label={`Assign ticket ${ticket.title || ticket._id.slice(-6)} to a service desk user`}
                          >
                            <option value="">Assign to...</option>
                            {serviceDeskUsers.map(sdUser => (
                              <option key={sdUser._id} value={sdUser._id}>
                                {sdUser.name} ({sdUser.email})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </>
                  )}

                  {(ticket.assignedTo || user.role === 'admin') && (
                    <>
                      <label htmlFor={`status-${ticket._id}`} className="sr-only">
                        Update ticket status
                      </label>
                      <select
                        id={`status-${ticket._id}`}
                        value={ticket.status}
                        onChange={e =>
                          handleStatusChange(ticket._id, e.target.value)
                        }
                        className="status-select"
                        aria-label={`Update status for ticket ${ticket.title || ticket._id.slice(-6)}`}
                      >
                        {ticket.status === 'closed' ? (
                          <>
                            <option value="closed">Closed</option>
                            <option value="open">Re-open</option>
                          </>
                        ) : (
                          <>
                            <option value="open">Open</option>
                            <option value="assigned">Assigned</option>
                            <option value="in-progress">In Progress</option>
                            <option value="closed">Closed</option>
                          </>
                        )}
                      </select>
                    </>
                  )}
                </div>
              )}

              <div className="ticket-card-actions" style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  const latestTicket = tickets.find(t => t._id === ticket._id) || ticket
                  setSelectedTicket(latestTicket)
                }}
                className="btn btn-link"
                aria-label="View ticket details"
              >
                View Details
              </button>
              <button
                onClick={() => handleShareEmail(ticket)}
                className="btn btn-secondary btn-sm"
                aria-label="Share ticket via email"
                title="Share via Email"
              >
                <span aria-hidden="true">📧</span> Share
              </button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedTicket && (
        <div 
          className="modal-overlay" 
          onClick={() => setSelectedTicket(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
        >
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedTicket(null)}
              aria-label="Close ticket details"
            >
              ×
            </button>

            <h2 id="modal-title">{selectedTicket.title}</h2>
            <p id="modal-description" className="sr-only">
              Detailed information about ticket {selectedTicket._id.slice(-6)}
            </p>

            <div className="modal-badges">
              <span
                className={`badge ${getStatusBadge(selectedTicket.status)}`}
              >
                {selectedTicket.status}
              </span>
              <span
                className={`badge ${getPriorityBadge(selectedTicket.priority)}`}
              >
                {selectedTicket.priority}
              </span>
            </div>

            <div className="modal-section">
              <h3>Description</h3>
              <p>{selectedTicket.description}</p>
            </div>

            <div className="modal-section">
              <h3>Details</h3>
              <p>
                <strong>Office:</strong> {selectedTicket.office?.name} -{' '}
                {selectedTicket.office?.address}
              </p>
              {selectedTicket.workstation && (
                <p>
                  <strong>Workstation:</strong> {selectedTicket.workstation}
                </p>
              )}
              <p>
                <strong>Reporter:</strong> {selectedTicket.reporter?.name} (
                {selectedTicket.reporter?.email})
              </p>
              {selectedTicket.assignedTo && (
                <p>
                  <strong>Assigned to:</strong> {selectedTicket.assignedTo.name}{' '}
                  ({selectedTicket.assignedTo.email})
                </p>
              )}
              <p>
                <strong>Created:</strong>{' '}
                {new Date(selectedTicket.createdAt).toLocaleString()}
              </p>
              <p>
                <strong>Updated:</strong>{' '}
                {new Date(selectedTicket.updatedAt).toLocaleString()}
              </p>
            </div>

            {selectedTicket.location && (
              <div className="modal-section">
                <h3>Location</h3>
                <p>
                  Lat: {selectedTicket.location.coordinates[1]}, Lng:{' '}
                  {selectedTicket.location.coordinates[0]}
                </p>
              </div>
            )}

            {selectedTicket.media && selectedTicket.media.length > 0 && (
              <div className="modal-section">
                <h3>Media</h3>
                {selectedTicket.media[0].type === 'video' || selectedTicket.media[0].url.startsWith('data:video/') ? (
                  <video
                    src={selectedTicket.media[0].url}
                    controls
                    className="modal-image"
                    style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px' }}
                    aria-label={`Video attachment for ticket ${selectedTicket.title || selectedTicket._id.slice(-6)}`}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    src={selectedTicket.media[0].url}
                    alt={`Media attachment for ticket ${selectedTicket.title || selectedTicket._id.slice(-6)}`}
                    className="modal-image"
                    loading="lazy"
                  />
                )}
              </div>
            )}

            {selectedTicket.aiAnalysis && (
              <div className="modal-section">
                <h3>AI Analysis</h3>
                <p>{selectedTicket.aiAnalysis.description}</p>
              </div>
            )}

            <div className="modal-section">
              <Chat ticketId={selectedTicket._id} ticket={selectedTicket} />
            </div>

            {(user.role === 'service_desk' || user.role === 'admin') && (
              <div className="modal-section">
                <h3>Ticket Actions</h3>
                {!selectedTicket.assignedTo && (
                  <>
                    {user.role === 'service_desk' && (
                      <button
                        onClick={() => {
                          handleAssign(selectedTicket._id)
                          setSelectedTicket(null)
                        }}
                        className="btn btn-secondary"
                        style={{ marginBottom: '1rem' }}
                        aria-label="Assign this ticket to yourself"
                      >
                        Assign to Me
                      </button>
                    )}
                    {user.role === 'admin' && serviceDeskUsers.length > 0 && (
                      <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label htmlFor="modal-assign-select">
                          Assign to Service Desk User
                        </label>
                        <select
                          id="modal-assign-select"
                          value={assigningTo[selectedTicket._id] || ''}
                          onChange={e => {
                            const selectedUserId = e.target.value
                            if (selectedUserId) {
                              setAssigningTo({ ...assigningTo, [selectedTicket._id]: selectedUserId })
                              handleAssign(selectedTicket._id, selectedUserId)
                              const selectedUser = serviceDeskUsers.find(u => u._id === selectedUserId)
                              setSelectedTicket({
                                ...selectedTicket,
                                assignedTo: selectedUser
                              })
                            }
                          }}
                          className="status-select"
                          aria-label="Assign ticket to a service desk user"
                        >
                          <option value="">Select user...</option>
                          {serviceDeskUsers.map(sdUser => (
                            <option key={sdUser._id} value={sdUser._id}>
                              {sdUser.name} ({sdUser.email})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}
                {(selectedTicket.assignedTo || user.role === 'admin') && (
                  <div className="form-group">
                    <label htmlFor="modal-status-select">
                      Update Status
                    </label>
                    <select
                      id="modal-status-select"
                      value={selectedTicket.status}
                      onChange={e => {
                        handleStatusChange(selectedTicket._id, e.target.value)
                        setSelectedTicket({
                          ...selectedTicket,
                          status: e.target.value
                        })
                      }}
                      className="status-select"
                      aria-label="Update ticket status"
                    >
                      {selectedTicket.status === 'closed' ? (
                        <>
                          <option value="closed">Closed</option>
                          <option value="open">Re-open</option>
                        </>
                      ) : (
                        <>
                          <option value="open">Open</option>
                          <option value="assigned">Assigned</option>
                          <option value="in-progress">In Progress</option>
                          <option value="closed">Closed</option>
                        </>
                      )}
                    </select>
                  </div>
                )}
              </div>
            )}

            <div className="modal-section share-section">
              <h3>Share Ticket</h3>
              <div className="share-buttons">
                <button
                  onClick={() => handleShareEmail(selectedTicket)}
                  className="btn btn-primary btn-share"
                  aria-label="Share ticket via email"
                >
                  <span aria-hidden="true">📧</span> Share via Email
                </button>
                <button
                  onClick={() => handleCopyToClipboard(selectedTicket)}
                  className="btn btn-secondary btn-share"
                  aria-label="Copy ticket details to clipboard"
                >
                  <span aria-hidden="true">📋</span> Copy Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default TicketHistory
