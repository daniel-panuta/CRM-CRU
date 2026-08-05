import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ConfirmModal from '../components/ConfirmModal'
import ContactsDirectory from '../components/ContactsDirectory'
import useContacts from '../hooks/useContacts'

export default function Dashboard({ user }) {
  const { contacts, loading, error, hasMore, fetchContacts, loadMore, deleteContact } = useContacts()
  const navigate = useNavigate()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    fetchContacts()
  }, [])

  const isAdmin = user?.role === 'admin'

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
      await deleteContact(deleteTarget.id)
      setShowDeleteModal(false)
      setDeleteTarget(null)
    } catch (err) {
      console.error(err)
      alert('Failed to delete contact')
    }
  }

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

      <ContactsDirectory
        title="Dashboard"
        subtitle="Review all shared contacts, filter by each visible column, and quickly jump to the records you need."
        contacts={contacts}
        loading={loading}
        error={error}
        emptyText="No contacts found. Try clearing the filters or add a new contact."
        showActions={isAdmin}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {hasMore && (
        <div className="flex justify-center pb-6">
          <button
            onClick={loadMore}
            disabled={loading}
            className="crm-button w-fit"
          >
            {loading ? 'Loading...' : 'Load More Contacts'}
          </button>
        </div>
      )}
    </div>
  )
}
