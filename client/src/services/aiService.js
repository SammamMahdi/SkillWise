import API_CONFIG from '../config/api'

export const aiService = {
  async ocrCv(file) {
    const form = new FormData()
    form.append('cv', file)

    const token = localStorage.getItem('token')

    const res = await fetch(`${API_CONFIG.BASE_URL}/ai/cv/ocr`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: form,
      credentials: 'include',
    })

    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'OCR failed')
    }
    return data
  },
  async recommendFromSkills(userSkills) {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_CONFIG.BASE_URL}/ai/cv/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ userSkills }),
      credentials: 'include',
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Recommendation failed')
    }
    return data
  },
  async recommendFromCvText(text) {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_CONFIG.BASE_URL}/ai/cv/recommend-from-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ text }),
      credentials: 'include',
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Recommendation failed')
    }
    return data
  }
}

export default aiService


