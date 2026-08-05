import { useMemo, useState } from 'react'
import SearchBar from './SearchBar'

function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21h6l12-12a2.1 2.1 0 0 0-3-3L6 18l-3 3z" />
      <path d="m14.5 6.5 3 3" />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

const emptyFilters = {
  name: '',
  phone: '',
  social: '',
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '')
}

function normalize(value) {
  return String(value || '').toLowerCase().trim()
}

function contactName(contact) {
  return `${contact.firstname || ''} ${contact.name || ''}`.trim()
}

function normalizeDateKey(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

function pickFirstNonEmpty(...values) {
  for (const value of values) {
    if (value === null || value === undefined) continue
    const text = String(value).trim()
    if (text) return text
  }
  return ''
}

function mergePhoneValues(...values) {
  const unique = []
  const seen = new Set()

  for (const value of values) {
    const raw = String(value || '').trim()
    if (!raw) continue
    const key = normalizePhone(raw)
    if (!key || seen.has(key)) continue
    seen.add(key)
    unique.push(raw)
  }

  return unique.slice(0, 3)
}

function extractResponsibleRows(contact) {
  const rows = []
  if (contact.created_by_name || contact.created_by) {
    rows.push({
      name: contact.created_by_name || String(contact.created_by),
      date: contact.created_at,
    })
  }

  if (Array.isArray(contact.history)) {
    for (const item of contact.history) {
      if (!item) continue
      rows.push({
        name: item.added_by_name || String(item.added_by || '—'),
        date: item.added_at,
      })
    }
  }

  const unique = []
  const seen = new Set()
  for (const row of rows) {
    const nameKey = String(row.name || '').trim().toLowerCase()
    const dayKey = normalizeDateKey(row.date)
    const key = `${nameKey}|${dayKey}`
    if (!nameKey || !dayKey || seen.has(key)) continue
    seen.add(key)
    unique.push(row)
  }

  return unique.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
}

function mergeContactsByNameAndPhone(rawContacts) {
  const groups = []

  for (const contact of rawContacts) {
    const nameKey = `${normalize(contact.firstname)}|${normalize(contact.name)}`
    const phones = [contact.tel1, contact.tel2, contact.tel3]
      .map(normalizePhone)
      .filter(Boolean)
    const phoneSet = new Set(phones)

    const matchingGroupIndex = groups.findIndex((group) => {
      if (group._nameKey !== nameKey) return false
      if (group._phoneSet.size === 0 || phoneSet.size === 0) return false
      for (const p of phoneSet) {
        if (group._phoneSet.has(p)) return true
      }
      return false
    })

    if (matchingGroupIndex === -1) {
      const socials = [contact.social1, contact.social2, contact.social3].filter(Boolean)
      groups.push({
        ...contact,
        _nameKey: nameKey,
        _phoneSet: phoneSet,
        _socials: socials,
        _responsibles: extractResponsibleRows(contact),
      })
      continue
    }

    const group = groups[matchingGroupIndex]

    for (const p of phoneSet) group._phoneSet.add(p)
    const mergedPhones = mergePhoneValues(
      group.tel1,
      group.tel2,
      group.tel3,
      contact.tel1,
      contact.tel2,
      contact.tel3,
    )
    group.tel1 = mergedPhones[0] || ''
    group.tel2 = mergedPhones[1] || ''
    group.tel3 = mergedPhones[2] || ''

    const mergedSocials = [...group._socials, contact.social1, contact.social2, contact.social3].filter(Boolean)
    group._socials = [...new Set(mergedSocials)].slice(0, 3)
    ;[group.social1, group.social2, group.social3] = group._socials

    group.email = pickFirstNonEmpty(group.email, contact.email)
    group.biserica = pickFirstNonEmpty(group.biserica, contact.biserica)
    group.recomandat_de = pickFirstNonEmpty(group.recomandat_de, contact.recomandat_de)

    const mergedResponsibles = [...group._responsibles, ...extractResponsibleRows(contact)]
    const seen = new Set()
    group._responsibles = mergedResponsibles
      .filter((row) => {
        const nameKey = String(row.name || '').trim().toLowerCase()
        const dayKey = normalizeDateKey(row.date)
        const key = `${nameKey}|${dayKey}`
        if (!nameKey || !dayKey || seen.has(key)) return false
        seen.add(key)
        return true
      })
      .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))

    const groupCreatedAt = new Date(group.created_at || 0)
    const contactCreatedAt = new Date(contact.created_at || 0)
    if (contactCreatedAt < groupCreatedAt) {
      group.created_at = contact.created_at
      group.id = contact.id
      group.created_by = contact.created_by
      group.created_by_name = contact.created_by_name
    }
  }

  return groups
}

function matchContact(contact, filters) {
  const nameValue = normalize(contactName(contact))
  const emailValue = normalize(contact.email)
  const phoneValue = normalize([contact.tel1, contact.tel2, contact.tel3].filter(Boolean).join(' '))
  const socialValue = normalize([contact.social1, contact.social2, contact.social3].filter(Boolean).join(' '))
  const nameFilter = normalize(filters.name)

  return (
    (nameValue.includes(nameFilter) || emailValue.includes(nameFilter)) &&
    phoneValue.includes(normalize(filters.phone)) &&
    socialValue.includes(normalize(filters.social))
  )
}

function detectNetwork(url) {
  const u = String(url || '').toLowerCase()
  if (u.includes('facebook.com')) return { name: 'Facebook', color: '#1877F2' }
  if (u.includes('linkedin.com')) return { name: 'LinkedIn', color: '#0A66C2' }
  if (u.includes('instagram.com')) return { name: 'Instagram', color: '#E1306C' }
  if (u.includes('twitter.com') || u.includes('x.com')) return { name: 'X', color: '#1DA1F2' }
  if (u.includes('github.com')) return { name: 'GitHub', color: '#181717' }
  return { name: u.replace(/^https?:\/\//, '').replace(/\/.*/, ''), color: '#6B7280' }
}

function SocialLink({ url }) {
  if (!url) return null
  const net = detectNetwork(url)
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center mr-2 mb-2 rounded px-3 py-1 text-sm font-medium text-white"
      style={{ backgroundColor: net.color }}
      title={url}
    >
      {net.name}
    </a>
  )
}

export default function ContactsDirectory({ title, subtitle, contacts, loading, error, emptyText, isPersonal = false, showActions = false, onEdit, onDelete }) {
  const [filters, setFilters] = useState(emptyFilters)

  const mergedContacts = useMemo(
    () => mergeContactsByNameAndPhone(contacts),
    [contacts],
  )

  const filteredContacts = useMemo(
    () => mergedContacts.filter((contact) => matchContact(contact, filters)),
    [mergedContacts, filters],
  )

  const onChange = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  const onReset = () => setFilters(emptyFilters)

  return (
    <div className="space-y-6">
      <div className="crm-hero">
        <p className="crm-label">Contacts</p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="crm-page-title">{title}</h1>
            {subtitle && <p className="crm-page-subtitle">{subtitle}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3 md:min-w-[260px]">
            <div className="crm-kpi">
              <p className="crm-label">Total</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{mergedContacts.length}</p>
            </div>
            <div className="crm-kpi">
              <p className="crm-label">Visible</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{filteredContacts.length}</p>
            </div>
          </div>
        </div>
      </div>

      <SearchBar filters={filters} onChange={onChange} onReset={onReset} />

      {error && <div className="crm-panel border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>}

      {loading && <div className="crm-panel px-5 py-8 text-center text-slate-600">Loading contacts...</div>}

      {!loading && filteredContacts.length === 0 && (
        <div className="crm-panel px-5 py-10 text-center text-slate-600">{emptyText}</div>
      )}

      {!loading && filteredContacts.length > 0 && (
        <div className="crm-table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Contact</th>
                <th>Biserica</th>
                <th>Cine a recomandat</th>
                <th>Email</th>
                <th>Phone Numbers</th>
                <th>Social Links</th>
                <th>Responsible</th>
                <th>Date Added</th>
                {(isPersonal || showActions) && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact) => (
                <tr key={contact.id}>
                  <td>
                    <div className="space-y-2">
                      <p className="text-base font-semibold text-slate-900">{contactName(contact)}</p>
                    </div>
                  </td>
                  <td>
                    <div className="text-slate-700">{contact.biserica || '—'}</div>
                  </td>
                  <td>
                    <div className="text-slate-700">{contact.recomandat_de || '—'}</div>
                  </td>
                  <td>
                    <div className="text-slate-700">{contact.email || '—'}</div>
                  </td>
                  <td>
                    <div className="space-y-2 text-slate-700">
                      {contact.tel1 && <p>{contact.tel1}</p>}
                      {contact.tel2 && <p>{contact.tel2}</p>}
                      {contact.tel3 && <p>{contact.tel3}</p>}
                      {!contact.tel1 && !contact.tel2 && !contact.tel3 && <p className="text-slate-400">No phone numbers</p>}
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-wrap">
                      <SocialLink url={contact.social1} />
                      <SocialLink url={contact.social2} />
                      <SocialLink url={contact.social3} />
                      {!contact.social1 && !contact.social2 && !contact.social3 && (
                        <span className="text-slate-400">No social links</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="space-y-1 text-slate-700">
                      {(contact._responsibles || []).map((entry, idx) => (
                        <p key={`${entry.name}-${entry.date}-${idx}`}>{entry.name || '—'}</p>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="space-y-1 text-slate-700">
                      {(contact._responsibles || []).map((entry, idx) => (
                        <p key={`${entry.name}-${entry.date}-${idx}`}>
                          {entry.date ? new Date(entry.date).toLocaleDateString() : '—'}
                        </p>
                      ))}
                    </div>
                  </td>
                  {(isPersonal || showActions) && (
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onEdit && onEdit(contact.id)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                          title="Edit contact"
                        >
                          <IconEdit />
                        </button>
                        <button
                          onClick={() => onDelete && onDelete(contact.id, contactName(contact))}
                          className="inline-flex items-center justify-center w-8 h-8 rounded bg-red-50 text-red-600 hover:bg-red-100 transition"
                          title="Delete contact"
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}