import axios from 'axios'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ConfirmModal from '../components/ConfirmModal'
import ContactsDirectory from '../components/ContactsDirectory'
import { API_URL } from '../lib/api'

const ITEMS_PER_PAGE = 50

export default function Profile({ user }) {
  const [profile, setProfile] = useState(null)
  const [myContacts, setMyContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Get profile info
        const profileResponse = await axios.get(`${API_URL}/contacts/profile`, { headers })
        setProfile(profileResponse.data)

        const contactsResponse = await axios.get(`${API_URL}/contacts/profile/contacts?limit=${ITEMS_PER_PAGE}&offset=0`, { headers })
        setMyContacts(contactsResponse.data)
        setCurrentPage(1)
        setHasMore(contactsResponse.data.length === ITEMS_PER_PAGE)
      } catch (err) {
        console.error('Failed to fetch profile', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [token])

  const loadMoreContacts = async () => {
    if (!hasMore || loadingMore) return
    
    setLoadingMore(true)
    try {
      const offset = currentPage * ITEMS_PER_PAGE
      const contactsResponse = await axios.get(`${API_URL}/contacts/profile/contacts?limit=${ITEMS_PER_PAGE}&offset=${offset}`, { headers })
      
      setMyContacts(prev => [...prev, ...contactsResponse.data])
      setCurrentPage(currentPage + 1)
      setHasMore(contactsResponse.data.length === ITEMS_PER_PAGE)
    } catch (err) {
      console.error('Failed to load more contacts', err)
    } finally {
      setLoadingMore(false)
    }
  }

  const handleEdit = (contactId) => {
    navigate(`/contact/edit/${contactId}`)
  }

  const handleDelete = (contactId, contactName) => {
    setDeleteTarget({ id: contactId, name: contactName })
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return

    try {
      await axios.delete(`${API_URL}/contacts/${deleteTarget.id}`, { headers })
      setMyContacts(myContacts.filter(c => c.id !== deleteTarget.id))
      setProfile({ ...profile, personal_contacts_count: profile.personal_contacts_count - 1 })
      setShowDeleteModal(false)
      setDeleteTarget(null)
    } catch (err) {
      alert('Failed to delete contact')
      console.error(err)
    }
  }

  if (loading) return <div className="crm-panel p-6">Loading profile...</div>

  return (
    <div className="space-y-6">
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Contact"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteModal(false)
          setDeleteTarget(null)
        }}
        confirmText="Delete"
        confirmColor="red"
      />
      
      <div className="crm-hero">
        <p className="crm-label">Account</p>
        <h1 className="crm-page-title">My Profile</h1>
        <p className="crm-page-subtitle">A compact overview of your account and the contacts you added.</p>
      </div>

      {profile && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="crm-kpi">
            <p className="crm-label">Name</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{profile.name}</p>
          </div>
          <div className="crm-kpi">
            <p className="crm-label">Email</p>
            <p className="mt-2 text-lg font-semibold text-slate-900 break-all">{profile.email}</p>
          </div>
          <div className="crm-kpi">
            <p className="crm-label">My Contacts</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{profile.personal_contacts_count}</p>
          </div>
        </div>
      )}

      <ContactsDirectory
        title={`My Contacts (${myContacts.length})`}
        subtitle="Filter your own records by name, phone, or social link."
        contacts={myContacts}
        loading={false}
        error={null}
        emptyText="You have not added any contacts yet."
        isPersonal={true}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {hasMore && (
        <div className="flex justify-center pb-6">
          <button
            onClick={loadMoreContacts}
            disabled={loadingMore}
            className="crm-button w-fit"
          >
            {loadingMore ? 'Loading...' : 'Load More of My Contacts'}
          </button>
        </div>
      )}
    </div>
  )
}
