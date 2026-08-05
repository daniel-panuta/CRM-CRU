
export default function ContactCard({ contact }) {
  const getSocialIcon = (url) => {
    if (!url) return null
    if (url.includes('facebook')) return '📘 Facebook'
    if (url.includes('twitter') || url.includes('x.com')) return '𝕏 Twitter'
    if (url.includes('linkedin')) return '🔗 LinkedIn'
    if (url.includes('instagram')) return '📷 Instagram'
    if (url.includes('github')) return '🐙 GitHub'
    return '🔗 Link'
  }

  return (
    <div className="crm-card mb-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">
            {contact.firstname} {contact.name}
          </h3>
          
          <div className="mt-2 space-y-1 text-sm">
            {contact.tel1 && <p>📱 {contact.tel1}</p>}
            {contact.tel2 && <p>📱 {contact.tel2}</p>}
            {contact.tel3 && <p>📱 {contact.tel3}</p>}
          </div>

          <div className="mt-3 flex gap-2 flex-wrap">
            {contact.social1 && (
              <a href={contact.social1} target="_blank" rel="noopener noreferrer" 
                className="text-xs crm-button crm-button-secondary">
                {getSocialIcon(contact.social1)}
              </a>
            )}
            {contact.social2 && (
              <a href={contact.social2} target="_blank" rel="noopener noreferrer" 
                className="text-xs crm-button crm-button-secondary">
                {getSocialIcon(contact.social2)}
              </a>
            )}
            {contact.social3 && (
              <a href={contact.social3} target="_blank" rel="noopener noreferrer" 
                className="text-xs crm-button crm-button-secondary">
                {getSocialIcon(contact.social3)}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
