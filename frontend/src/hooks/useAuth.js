import axios from 'axios'
import { useState } from 'react'
import { API_URL } from '../lib/api'

export default function useAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const login = async (email, password) => {
    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      })
      localStorage.setItem('token', response.data.access_token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      return response.data
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, login }
}
