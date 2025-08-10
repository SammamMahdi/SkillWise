import axios from 'axios'
const API = import.meta.env?.VITE_API_BASE || '/api'

export async function checkUsernameAvailable(u) {
  const { data } = await axios.get(`${API}/public/username-available`, { params: { u } })
  return data
}

export async function setMyUsername(username, token) {
  const { data } = await axios.patch(
    `${API}/username`,
    { username },
    { headers: { Authorization: `Bearer ${token}` } } // <-- Bearer token
  )
  return data
}
