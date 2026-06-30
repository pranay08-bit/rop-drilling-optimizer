import { useState, useEffect } from 'react'
import Button from '../components/Button'
import AddFormationModal from '../components/AddFormationModal'

function FormationTopsTab({ initialFormations, initialSelectedFormations, onSave }) {
  const [formations, setFormations] = useState(initialFormations)
  const [activeFormations, setActiveFormations] = useState(initialSelectedFormations)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    setFormations(initialFormations)
    setActiveFormations(initialSelectedFormations)
  }, [initialFormations, initialSelectedFormations])

  const saveConfigState = (nextFormations = formations, nextActiveFormations = activeFormations, showSuccessModal = false) => {
    onSave(nextFormations, nextActiveFormations, showSuccessModal)
  }

  const toggleActive = (formation) => {
    const nextActive = activeFormations.includes(formation)
      ? activeFormations.filter(f => f !== formation)
      : [...activeFormations, formation]
    setActiveFormations(nextActive)
    saveConfigState(formations, nextActive, false)
  }

  const handleDeleteFormation = (formation) => {
    const nextFormations = formations.filter(f => f !== formation)
    const nextActive = activeFormations.filter(f => f !== formation)
    setFormations(nextFormations)
    setActiveFormations(nextActive)
    saveConfigState(nextFormations, nextActive, false)
  }

  const handleAddFromModal = (selectedNames) => {
    let nextFormations = [...formations]
    let nextActive = [...activeFormations]
    let changed = false

    selectedNames.forEach(name => {
      if (!nextFormations.includes(name)) {
        nextFormations.push(name)
        nextActive.push(name)
        changed = true
      }
    })

    if (changed) {
      setFormations(nextFormations)
      setActiveFormations(nextActive)
      saveConfigState(nextFormations, nextActive, false)
    }
  }

  const filteredFormations = formations.filter(f =>
    f.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSave = () => {
    saveConfigState(formations, activeFormations, true)
  }

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
        Formation Tops Configuration
      </h1>
      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
        Define geological markers for analysis segmentation
      </p>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Search formation tops..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            background: '#1a1a1a',
            border: '0.5px solid var(--border-default)',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '13px',
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        />
        <Button label="+ Add Formation Top" variant="primary" onClick={() => setIsModalOpen(true)} />
      </div>

      <div style={{ border: '0.5px solid var(--border-default)', borderRadius: '6px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', padding: '8px 12px', background: 'var(--bg-surface)', borderBottom: '0.5px solid var(--border-default)' }}>
          <span style={{ flex: 1, fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>Formation Top Name</span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>Actions</span>
        </div>
        {filteredFormations.map((formation) => {
          const isChecked = activeFormations.includes(formation)
          return (
            <div key={formation} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderBottom: '0.5px solid var(--border-default)',
            }}>
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleActive(formation)}
                style={{ accentColor: 'var(--color-primary)', width: '14px', height: '14px', cursor: 'pointer' }}
              />
              <span style={{ flex: 1, fontSize: '13px', color: isChecked ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{formation}</span>
              <span 
                onClick={() => handleDeleteFormation(formation)} 
                style={{ fontSize: '14px', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.target.style.color = 'var(--color-error)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
              >
                🗑
              </span>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Rows: {formations.length}</span>
        <Button label="Save Configuration" variant="primary" onClick={handleSave} />
      </div>

      <AddFormationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddFromModal}
      />
    </div>
  )
}

export default FormationTopsTab