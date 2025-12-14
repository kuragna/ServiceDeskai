export const base_api = 'http://localhost:5000/api'

export async function fetchProtected(url, method, token, body = null) {
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }

  if (method !== 'GET' && body) {
    options.body = JSON.stringify(body)
  }

  return await fetch(url, options)
}

export async function fetchUpload(file, token) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${base_api}/media/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })
  if (!response.ok) {
    throw new Error('Media upload failed')
  }
  return await response.json()
}
