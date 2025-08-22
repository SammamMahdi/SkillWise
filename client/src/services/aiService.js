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
  }
}

export default aiService


