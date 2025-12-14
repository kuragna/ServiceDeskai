export const generateShareEmail = (ticket) => {
  if (!ticket) {
    throw new Error('Ticket is required for sharing')
  }

  const ticketId = ticket._id ? `#${ticket._id.slice(-6)}` : 'N/A'
  const subject = encodeURIComponent(
    `ServiceDeskai Ticket ${ticketId}: ${ticket.title || 'Ticket Report'}`
  )
  
  let body = `ServiceDeskai Ticket Report\n`
  body += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
  
  body += `Ticket ID: ${ticketId}\n`
  body += `Title: ${ticket.title || 'N/A'}\n`
  body += `Status: ${(ticket.status || 'N/A').toUpperCase()}\n`
  body += `Priority: ${(ticket.priority || 'N/A').toUpperCase()}\n\n`
  
  body += `Description:\n${ticket.description || 'N/A'}\n\n`
  
  body += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
  body += `DETAILS\n`
  body += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
  
  if (ticket.office) {
    body += `Office: ${ticket.office.name || 'N/A'}`
    if (ticket.office.address) {
      body += `\nAddress: ${ticket.office.address}`
    }
    if (ticket.office.city && ticket.office.country) {
      body += `\n${ticket.office.city}, ${ticket.office.country}`
    }
    body += `\n`
  }
  
  if (ticket.workstation) {
    body += `Workstation: ${ticket.workstation}\n`
  }
  
  if (ticket.reporter) {
    body += `Reporter: ${ticket.reporter.name || 'N/A'}`
    if (ticket.reporter.email) {
      body += ` (${ticket.reporter.email})`
    }
    body += `\n`
  }
  
  if (ticket.assignedTo) {
    body += `Assigned to: ${ticket.assignedTo.name || 'N/A'}`
    if (ticket.assignedTo.email) {
      body += ` (${ticket.assignedTo.email})`
    }
    body += `\n`
  }
  
  if (ticket.location && ticket.location.coordinates) {
    const lat = ticket.location.coordinates[1]
    const lng = ticket.location.coordinates[0]
    body += `Location:\n`
    body += `  Latitude: ${lat}\n`
    body += `  Longitude: ${lng}\n`
    body += `  Google Maps: https://www.google.com/maps?q=${lat},${lng}\n`
  }
  
  if (ticket.createdAt) {
    body += `Created: ${new Date(ticket.createdAt).toLocaleString()}\n`
  }
  
  if (ticket.updatedAt) {
    body += `Last Updated: ${new Date(ticket.updatedAt).toLocaleString()}\n`
  }
  
  if (ticket.closedAt) {
    body += `Closed: ${new Date(ticket.closedAt).toLocaleString()}\n`
  }
  
  if (ticket.media && ticket.media.length > 0) {
    body += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
    body += `MEDIA ATTACHMENTS (${ticket.media.length})\n`
    body += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
    ticket.media.forEach((media, index) => {
      body += `${index + 1}. ${media.type || 'image'}: ${media.url}\n`
    })
  }
  
  if (ticket.aiAnalysis && ticket.aiAnalysis.description) {
    body += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
    body += `AI ANALYSIS\n`
    body += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
    body += `${ticket.aiAnalysis.description}\n`
    
    if (ticket.aiAnalysis.labels && ticket.aiAnalysis.labels.length > 0) {
      body += `\nDetected Labels: ${ticket.aiAnalysis.labels.join(', ')}\n`
    }
    
    if (ticket.aiAnalysis.objects && ticket.aiAnalysis.objects.length > 0) {
      body += `Detected Objects: ${ticket.aiAnalysis.objects.join(', ')}\n`
    }
  }
  
  body += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
  body += `This ticket was shared from ServiceDeskai\n`
  body += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
  
  return {
    subject,
    body: encodeURIComponent(body)
  }
}

/**
 * Open email client with pre-filled ticket details
 * @param {Object} ticket - The ticket object to share
 * @param {string} recipientEmail - Optional recipient email address
 * @returns {boolean} - Success status
 */
export const shareTicketViaEmail = (ticket, recipientEmail = null) => {
  try {
    const { subject, body } = generateShareEmail(ticket)
    let mailtoLink = `mailto:`
    
    if (recipientEmail) {
      mailtoLink += encodeURIComponent(recipientEmail)
    }
    
    mailtoLink += `?subject=${subject}&body=${body}`
    
    window.location.href = mailtoLink
    return true
  } catch (error) {
    console.error('Error sharing ticket via email:', error)
    return false
  }
}

/**
 * Copy ticket details to clipboard (alternative sharing method)
 * @param {Object} ticket - The ticket object to share
 * @returns {Promise<boolean>} - Success status
 */
export const copyTicketToClipboard = async (ticket) => {
  const { body } = generateShareEmail(ticket)
  const text = decodeURIComponent(body)
  
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
    return false
  }
}

