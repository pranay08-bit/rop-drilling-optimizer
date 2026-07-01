import { useState } from 'react'
import { BASE_URL } from '../api/client'

const WELL_TEMPLATES = [
  { name: 'Apache Well A1', file: 'Apache_Well_A1.csv' },
  { name: 'Baker Hughes Test', file: 'Baker_Hughes_Test.csv' },
  { name: 'Chevron Deep 3', file: 'Chevron_Deep_3.csv' },
  { name: 'Devon Energy W12', file: 'Devon_Energy_W12.csv' },
  { name: 'ExxonMobil TX-5', file: 'ExxonMobil_TX_5.csv' },
]

function AddWellsModal({ isOpen, onClose, onAdd, onRefresh }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNames, setSelectedNames] = useState(['Apache Well A1'])
  const [uploadStatus, setUploadStatus] = useState(null)

  if (!isOpen) return null

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      setUploadStatus({ type: 'error', msg: 'Only CSV files are supported.' })
      return
    }

    setUploadStatus({ type: 'loading', msg: 'Uploading and registering file...' })

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${BASE_URL}/api/wells/upload`, {
        method: 'POST',
        body: formData,
      })
      const result = await response.json()
      if (result.status === 'success') {
        setUploadStatus({ type: 'success', msg: result.message })
        setTimeout(() => {
          if (onRefresh) onRefresh()
          onClose()
          setUploadStatus(null)
        }, 1500)
      } else {
        setUploadStatus({ type: 'error', msg: result.message || 'Upload failed.' })
      }
    } catch (err) {
      console.error(err)
      setUploadStatus({ type: 'error', msg: 'Network error uploading file.' })
    }
  }

  const toggleSelect = (name) => {
    setSelectedNames(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
  }

  const filteredTemplates = WELL_TEMPLATES.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAdd = () => {
    const selectedDefs = WELL_TEMPLATES.filter(t => selectedNames.includes(t.name))
    // If user searched a custom well that's not in templates and hit enter, we can also add it
    if (searchQuery.trim() && !WELL_TEMPLATES.some(t => t.name.toLowerCase() === searchQuery.toLowerCase().trim())) {
      const customName = searchQuery.trim()
      selectedDefs.push({
        name: customName,
        file: `${customName.replace(/\s+/g, '_')}.csv`
      })
    }
    onAdd(selectedDefs)
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
          Add Wells to Configuration
        </h2>

        {/* Search */}
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            type="text"
            placeholder="Search wells..."
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

        {/* File Upload Section */}
        <div style={{
          border: '1.5px dashed #2A2A2A',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center',
          background: '#0D0D0D',
          cursor: 'pointer',
          position: 'relative',
          transition: 'border-color 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}
        >
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontFamily: 'Inter, sans-serif' }}>
            Or upload a new well CSV file directly
          </span>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              opacity: 0, cursor: 'pointer'
            }}
          />
          <button style={{
            background: 'transparent',
            color: 'var(--color-primary)',
            border: '0.5px solid var(--color-primary)',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '11px',
            fontWeight: '600',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            pointerEvents: 'none'
          }}>
            Choose CSV File
          </button>
          {uploadStatus && (
            <div style={{ 
              fontSize: '11px', 
              color: uploadStatus.type === 'success' ? '#1D9E75' : uploadStatus.type === 'loading' ? 'var(--color-info)' : '#E24B4A', 
              marginTop: '8px', 
              fontFamily: 'Inter, sans-serif',
              fontWeight: '500'
            }}>
              {uploadStatus.msg}
            </div>
          )}
        </div>

        {/* Selected count */}
        <div style={{
          fontSize: '12px',
          color: 'var(--color-primary)',
          fontWeight: '500',
          fontFamily: 'Inter, sans-serif'
        }}>
          {selectedNames.length} {selectedNames.length === 1 ? 'well' : 'wells'} selected
        </div>

        {/* Well list */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          border: '0.5px solid var(--border-default)',
          borderRadius: '8px',
          background: '#0D0D0D',
          overflow: 'hidden'
        }}>
          {filteredTemplates.map((w) => {
            const isSelected = selectedNames.includes(w.name)
            return (
              <div
                key={w.name}
                onClick={() => toggleSelect(w.name)}
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
                  {w.name}
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
              Press Enter or Save to add "{searchQuery}" as a custom well
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
            Add Selected Wells
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

export default AddWellsModal
