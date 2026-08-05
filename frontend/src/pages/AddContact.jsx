import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useContacts from '../hooks/useContacts'

export default function AddContact() {
  const [formData, setFormData] = useState({
    name: '',
    firstname: '',
    email: '',
    biserica: '',
    recomandat_de: '',
    tel1: '',
    tel2: '',
    tel3: '',
    social1: '',
    social2: '',
    social3: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { addContact } = useContacts()
  const navigate = useNavigate()

  const normalizeValue = (value) => value.trim()

  const hasContactName = () => Boolean(normalizeValue(formData.name) || normalizeValue(formData.firstname))

  const hasPhoneNumber = () => Boolean(normalizeValue(formData.tel1) || normalizeValue(formData.tel2) || normalizeValue(formData.tel3))

  const handleChange = (e) => {
    const { name, value } = e.target
    
    // For phone fields, only allow numbers, +, and -
    if (['tel1', 'tel2', 'tel3'].includes(name)) {
      const filtered = value.replace(/[^0-9+\-]/g, '')
      setFormData(prev => ({ ...prev, [name]: filtered }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!hasContactName()) {
      setError('Add at least a last name or a first name.')
      return
    }

    if (!hasPhoneNumber()) {
      setError('Add at least one phone number.')
      return
    }

    setLoading(true)
    try {
      // Filter empty fields
      const data = Object.keys(formData).reduce((acc, key) => {
        const value = normalizeValue(formData[key])
        if (value) acc[key] = value
        return acc
      }, {})

      // Attach created_at and responsible (if available from localStorage)
      const userName = localStorage.getItem('userName') || 'Panuta Agata'
      data.created_by_name = userName
      data.created_at = new Date().toISOString()

      await addContact(data)
      navigate('/dashboard')
    } catch (err) {
      const detail = err.response?.data?.detail
      if (typeof detail === 'string') {
        setError(detail)
      } else if (Array.isArray(detail)) {
        setError(detail.map((item) => item?.msg || item?.message || 'Invalid value').join(' '))
      } else if (detail && typeof detail === 'object') {
        setError(JSON.stringify(detail))
      } else {
        setError('Failed to add contact. Check your network or backend logs.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="crm-hero">
        <p className="crm-label">Create</p>
        <h1 className="crm-page-title">Add New Contact</h1>
        <p className="crm-page-subtitle">Keep the record clean and complete. At least one phone number is required.</p>
      </div>

      {error && <div className="crm-panel border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="crm-panel space-y-6 p-6 md:p-8">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2">
            <span className="crm-label">Last Name</span>
            <input type="text" name="name" placeholder="Doe" value={formData.name} onChange={handleChange} className="crm-input" />
          </label>
          <label className="space-y-2">
            <span className="crm-label">First Name</span>
            <input type="text" name="firstname" placeholder="John" value={formData.firstname} onChange={handleChange} className="crm-input" />
          </label>
          <label className="space-y-2">
            <span className="crm-label">Email (optional)</span>
            <input type="email" name="email" placeholder="john@example.com" value={formData.email} onChange={handleChange} className="crm-input" />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="crm-label">Biserica</span>
            <input type="text" name="biserica" placeholder="Ex: Biserica Sf. Dumitru" value={formData.biserica} onChange={handleChange} className="crm-input" />
          </label>
          <label className="space-y-2">
            <span className="crm-label">Cine a recomandat</span>
            <input type="text" name="recomandat_de" placeholder="Ex: Ion Popescu" value={formData.recomandat_de} onChange={handleChange} className="crm-input" />
          </label>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="crm-section-title">Phone Numbers</p>
            <span className="crm-muted">At least one required</span>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <input type="tel" name="tel1" placeholder="Primary phone" pattern="[0-9+\-]*" value={formData.tel1} onChange={handleChange} className="crm-input" title="Only numbers, +, and - allowed" />
            <input type="tel" name="tel2" placeholder="Secondary phone" pattern="[0-9+\-]*" value={formData.tel2} onChange={handleChange} className="crm-input" title="Only numbers, +, and - allowed" />
            <input type="tel" name="tel3" placeholder="Other phone" pattern="[0-9+\-]*" value={formData.tel3} onChange={handleChange} className="crm-input" title="Only numbers, +, and - allowed" />
          </div>
        </div>

        <div>
          <p className="mb-3 crm-section-title">Social Links</p>
          <div className="grid gap-3 md:grid-cols-3">
            <input type="url" name="social1" placeholder="LinkedIn / Twitter / Website" value={formData.social1} onChange={handleChange} className="crm-input" />
            <input type="url" name="social2" placeholder="Social link 2" value={formData.social2} onChange={handleChange} className="crm-input" />
            <input type="url" name="social3" placeholder="Social link 3" value={formData.social3} onChange={handleChange} className="crm-input" />
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2 md:flex-row">
          <button type="submit" disabled={loading} className="crm-button-primary flex-1">
            {loading ? 'Adding...' : 'Save contact'}
          </button>
          <button type="button" onClick={() => navigate('/dashboard')} className="crm-button-secondary flex-1">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
