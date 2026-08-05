export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Delete', confirmColor = 'red' }) {
  if (!isOpen) return null

  const colorClass = confirmColor === 'red' 
    ? 'bg-red-600 hover:bg-red-700 text-white' 
    : 'bg-blue-600 hover:bg-blue-700 text-white'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="crm-panel mx-4 max-w-md space-y-6 p-8">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-2 text-sm text-slate-600">{message}</p>
        </div>
        
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="crm-button-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`crm-button flex-1 ${colorClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
