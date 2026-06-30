import { useState } from 'react'

const FORMATION_TEMPLATES = [
  'Sulaiy',
  'ETop1',
  'Mishrif',
  'Yamama',
  'Hartha',
  'Zubair',
  'Nahr Umr',
  'Rumaila',
]

function AddFormationModal({ isOpen, onClose, onAdd }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNames, setSelectedNames] = useState(['Sulaiy', 'ETop1'])

  if (!isOpen) return null

  const toggleSelect = (name) => {
    setSelectedNames(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
  }

  const filteredTemplates = FORMATION_TEMPLATES.filter(t =>
    t.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAdd = () => {
    const selected = [...selectedNames]
    // If user searched a custom formation that's not in templates, also add it
    if (searchQuery.trim() && !FORMATION_TEMPLATES.some(t => t.toLowerCase() === searchQuery.toLowerCase().trim())) {
      const customName = searchQuery.trim()
      if (!selected.includes(customName)) {
        selected.push(customName)
      }
    }
    onAdd(selected)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: '#161616',
        border: '0.5px solid #2A2A2A',
        borderRadius: '16px',
        padding: '32px',
        width: '440px',
        boxShadow: '0 20px 45px rgba(0, 0, 0, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Title */}
        <h2 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: '#FFFFFF',
          margin: 0,
          fontFamily: 'Inter, sans-serif'
        }}>
          Add Formation Tops
        </h2>

        {/* Search */}
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            type="text"
            placeholder="Search formation tops..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: '#0D0D0D',
              border: '1.5px solid var(--color-info)',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '13px',
              color: '#FFFFFF',
              outline: 'none',
              fontFamily: 'Inter, sans-serif',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Selected count */}
        <div style={{
          fontSize: '12px',
          color: 'var(--color-primary)',
          fontWeight: '500',
          fontFamily: 'Inter, sans-serif'
        }}>
          {selectedNames.length} {selectedNames.length === 1 ? 'formation' : 'formations'} selected
        </div>

        {/* Formation list */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          border: '0.5px solid var(--border-default)',
          borderRadius: '8px',
          background: '#0D0D0D',
          maxHeight: '240px',
          overflowY: 'auto'
        }}>
          {filteredTemplates.map((name) => {
            const isSelected = selectedNames.includes(name)
            return (
              <div
                key={name}
                onClick={() => toggleSelect(name)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderBottom: '0.5px solid var(--border-default)',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(127, 119, 221, 0.05)' : 'transparent',
                  transition: 'background 0.2s'
                }}
              >
                {/* Custom Checkbox */}
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '4px',
                  border: isSelected ? 'none' : '1px solid var(--text-tertiary)',
                  background: isSelected ? 'var(--color-primary)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {isSelected && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>

                {/* Name */}
                <span style={{
                  flex: 1,
                  fontSize: '13px',
                  color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  {name}
                </span>

                {/* Badge pill */}
                <div style={{
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontFamily: 'Inter, sans-serif',
                  border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--border-default)',
                  color: isSelected ? 'var(--color-primary)' : 'var(--text-tertiary)',
                  background: isSelected ? 'rgba(127, 119, 221, 0.1)' : 'transparent'
                }}>
                  {isSelected ? 'Selected' : '+ Add'}
                </div>
              </div>
            )
          })}
          {filteredTemplates.length === 0 && (
            <div style={{
              padding: '16px',
              fontSize: '12px',
              color: 'var(--text-tertiary)',
              textAlign: 'center',
              fontFamily: 'Inter, sans-serif'
            }}>
              Press Enter or Add Selected to add "{searchQuery}" as a custom formation
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          width: '100%',
          marginTop: '8px'
        }}>
          <button
            onClick={handleAdd}
            style={{
              background: 'var(--color-primary)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '14px 20px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              width: '100%'
            }}
          >
            Add Selected Formations
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              color: '#FFFFFF',
              border: '0.5px solid var(--border-default)',
              borderRadius: '8px',
              padding: '14px 20px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              width: '100%'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddFormationModal
