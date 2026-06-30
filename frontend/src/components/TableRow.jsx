import { useState } from 'react'

function TableRow({ wellName, variant = 'default', onDelete, onToggle }) {
  const [isHovered, setIsHovered] = useState(false)

  const isSelected = variant === 'selected'
  
  const getBackground = () => {
    if (isSelected) return 'rgba(29, 158, 117, 0.15)' // dark green tint
    if (isHovered) return '#1A1A1A'
    return 'transparent'
  }

  const getBorderColor = () => {
    if (isSelected) return '#1D9E75'
    return 'transparent'
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderBottom: '0.5px solid var(--border-default)',
        background: getBackground(),
        borderLeft: `3px solid ${getBorderColor()}`,
        cursor: 'pointer',
        transition: 'all 0.15s ease-in-out'
      }}
    >
      {/* Custom Checkbox */}
      <div 
        style={{
          width: '16px',
          height: '16px',
          borderRadius: '4px',
          border: isSelected ? 'none' : '1.5px solid var(--text-tertiary)',
          background: isSelected ? '#1D9E75' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.1s'
        }}
      >
        {isSelected && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        )}
      </div>

      {/* Well Name */}
      <span style={{
        flex: 1,
        fontSize: '13px',
        color: isSelected ? '#FFFFFF' : 'var(--text-primary)',
        fontFamily: 'Inter, sans-serif',
        fontWeight: isSelected ? '500' : '400'
      }}>
        {wellName}
      </span>

      {/* Action Trash Icon */}
      <span
        onClick={(e) => {
          e.stopPropagation() // Prevent row selection when clicking delete
          onDelete(e)
        }}
        style={{
          fontSize: '14px',
          color: isHovered ? '#E24B4A' : 'var(--text-tertiary)',
          cursor: 'pointer',
          transition: 'color 0.15s',
          padding: '4px'
        }}
      >
        🗑
      </span>
    </div>
  )
}

export default TableRow