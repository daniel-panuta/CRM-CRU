const filterFields = [
  { key: 'name', label: 'Name', placeholder: 'Search last or first name' },
  { key: 'phone', label: 'Phone', placeholder: 'Search phone numbers' },
  { key: 'social', label: 'Social', placeholder: 'Search social links' },
]

export default function SearchBar({ filters, onChange, onReset }) {
  return (
    <div className="crm-panel mb-6 p-5">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="crm-label">Filter contacts</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">Search each column separately</h2>
        </div>
        <button type="button" onClick={onReset} className="crm-button-secondary w-fit">
          Reset filters
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {filterFields.map((field) => (
          <label key={field.key} className="space-y-2">
            <span className="crm-label">{field.label}</span>
            <input
              type="text"
              value={filters[field.key] || ''}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="crm-input"
            />
          </label>
        ))}
      </div>
    </div>
  )
}
