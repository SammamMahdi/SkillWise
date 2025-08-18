import axios from 'axios'
import API_CONFIG from '../config/api.js';

const API = API_CONFIG.BASE_URL

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
