import axios from 'axios'
import { useState } from 'react'
import { API_URL } from '../lib/api'

const ITEMS_PER_PAGE = 50

export default function useContacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const token = localStorage.getItem('token')

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }

  const fetchContacts = async (search = '', reset = true) => {
    const page = reset ? 0 : currentPage
    const offset = page * ITEMS_PER_PAGE
    
    setLoading(true)
    try {
      const url = search 
        ? `${API_URL}/contacts?search=${encodeURIComponent(search)}&limit=${ITEMS_PER_PAGE}&offset=${offset}`
        : `${API_URL}/contacts?limit=${ITEMS_PER_PAGE}&offset=${offset}`
      
      const response = await axios.get(url, { headers })
      
      if (reset) {
        setContacts(response.data)
        setCurrentPage(1)
        setSearchTerm(search)
      } else {
        setContacts(prev => [...prev, ...response.data])
        setCurrentPage(page + 1)
      }
      
      // If we got fewer items than requested, no more pages
      setHasMore(response.data.length === ITEMS_PER_PAGE)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch contacts')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = async () => {
    if (!hasMore || loading) return
    await fetchContacts(searchTerm, false)
  }

  const addContact = async (contactData) => {
    try {
      const response = await axios.post(`${API_URL}/contacts`, contactData, { headers })
      setContacts((current) => {
        const exists = current.some((c) => c.id === response.data.id)
        if (exists) {
          return current.map((c) => (c.id === response.data.id ? response.data : c))
        }
        return [response.data, ...current]
      })
      return response.data
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add contact')
      throw err
    }
  }

  const deleteContact = async (id) => {
    try {
      await axios.delete(`${API_URL}/contacts/${id}`, { headers })
      setContacts(contacts.filter(c => c.id !== id))
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete contact')
      throw err
    }
  }

  return { 
    contacts, 
    loading, 
    error, 
    hasMore,
    fetchContacts, 
    loadMore,
    addContact, 
    deleteContact 
  }
}
