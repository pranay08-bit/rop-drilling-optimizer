import { useState, useEffect } from 'react'
import StatusBanner from '../components/StatusBanner'
import TableRow from '../components/TableRow'
import Button from '../components/Button'
import AddWellsModal from '../components/AddWellsModal'

function WellsTab({ availableWells, initialSelected, initialDefinitions, onSave, onRefresh }) {
  const [selectedWells, setSelectedWells] = useState(initialSelected)
  const [wellsList, setWellsList] = useState(availableWells)
  const [definitions, setDefinitions] = useState(initialDefinitions)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectionType, setSelectionType] = useState('all') // 'all' | 'specific'

  // Initialize selection type based on match
  useEffect(() => {
    if (initialSelected.length > 0 && initialSelected.length === availableWells.length) {
      setSelectionType('all')
    } else {
      setSelectionType('specific')
    }
    setSelectedWells(initialSelected)
  }, [initialSelected, availableWells])

  useEffect(() => {
    setWellsList(availableWells)
  }, [availableWells])

  useEffect(() => {
    setDefinitions(initialDefinitions)
  }, [initialDefinitions])

  const saveConfigState = (
    nextWellsList = wellsList,
    nextSelectedWells = selectedWells,
    nextSelectionType = selectionType,
    nextDefinitions = definitions,
    showSuccessModal = false
  ) => {
    const wellsToSave = nextSelectionType === 'all' ? nextWellsList : nextSelectedWells
    onSave(wellsToSave, nextDefinitions, showSuccessModal)
  }

  const toggleWell = (well) => {
    let nextSelectionType = selectionType
    let nextSelectedWells = selectedWells

    if (selectionType === 'all') {
      nextSelectionType = 'specific'
      nextSelectedWells = [well]
      setSelectionType('specific')
      setSelectedWells([well])
    } else {
      nextSelectedWells = selectedWells.includes(well)
        ? selectedWells.filter(w => w !== well)
        : [...selectedWells, well]
      setSelectedWells(nextSelectedWells)
    }
    saveConfigState(wellsList, nextSelectedWells, nextSelectionType, definitions, false)
  }

  const handleDeleteWell = (e, well) => {
    e.stopPropagation() // Prevent selecting/deselecting the well when deleting
    const nextWellsList = wellsList.filter(w => w !== well)
    const nextSelectedWells = selectedWells.filter(w => w !== well)
    const nextDefinitions = definitions.filter(d => d.name !== well)
    setWellsList(nextWellsList)
    setSelectedWells(nextSelectedWells)
    setDefinitions(nextDefinitions)
    saveConfigState(nextWellsList, nextSelectedWells, selectionType, nextDefinitions, false)
  }

  const handleAddFromModal = (selectedDefs) => {
    let nextWellsList = [...wellsList]
    let nextSelectedWells = [...selectedWells]
    let nextDefinitions = [...definitions]
    let changed = false

    selectedDefs.forEach(def => {
      if (!nextWellsList.includes(def.name)) {
        nextWellsList.push(def.name)
        nextSelectedWells.push(def.name)
        nextDefinitions.push({ name: def.name, file: def.file })
        changed = true
      }
    })

    if (changed) {
      setWellsList(nextWellsList)
      setSelectedWells(nextSelectedWells)
      setDefinitions(nextDefinitions)
      saveConfigState(nextWellsList, nextSelectedWells, selectionType, nextDefinitions, false)
    }
  }

  const filteredWells = wellsList.filter(w =>
    w.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSave = () => {
    saveConfigState(wellsList, selectedWells, selectionType, definitions, true)
  }

  // Count to display in banner
  const activeSelectedCount = selectionType === 'all' ? wellsList.length : selectedWells.length

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px', fontFamily: 'Inter, sans-serif' }}>
        Well Selection Configuration
      </h1>
      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', fontFamily: 'Inter, sans-serif' }}>
        Choose individual wells for training
      </p>

      {/* Selection Type Selector (Figma Design Matches) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
        <div
          onClick={() => {
            setSelectionType('specific')
            saveConfigState(wellsList, selectedWells, 'specific', definitions, false)
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '14px 18px',
            borderRadius: '8px',
            background: '#161616',
            border: selectionType === 'specific' ? '1.5px solid var(--color-primary)' : '1.5px solid #2A2A2A',
            cursor: 'pointer',
            transition: 'border 0.2s',
            boxSizing: 'border-box'
          }}
        >
          <div style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            border: selectionType === 'specific' ? '5px solid var(--color-primary)' : '1.5px solid var(--text-tertiary)',
            background: selectionType === 'specific' ? '#0D0D0D' : 'transparent',
            boxSizing: 'border-box',
            transition: 'all 0.15s'
          }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF', fontFamily: 'Inter, sans-serif' }}>Select Specific Wells</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', fontFamily: 'Inter, sans-serif' }}>choose individual wells for training</div>
          </div>
        </div>

        <div
          onClick={() => {
            setSelectionType('all')
            setSelectedWells(wellsList)
            saveConfigState(wellsList, wellsList, 'all', definitions, false)
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '14px 18px',
            borderRadius: '8px',
            background: '#161616',
            border: selectionType === 'all' ? '1.5px solid var(--color-primary)' : '1.5px solid #2A2A2A',
            cursor: 'pointer',
            transition: 'border 0.2s',
            boxSizing: 'border-box'
          }}
        >
          <div style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            border: selectionType === 'all' ? '5px solid var(--color-primary)' : '1.5px solid var(--text-tertiary)',
            background: selectionType === 'all' ? '#0D0D0D' : 'transparent',
            boxSizing: 'border-box',
            transition: 'all 0.15s'
          }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF', fontFamily: 'Inter, sans-serif' }}>All Wells</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', fontFamily: 'Inter, sans-serif' }}>exclude specific</div>
          </div>
        </div>
      </div>

      {/* Banner */}
      <StatusBanner
        variant={activeSelectedCount > 0 ? 'success' : 'warning'}
        title={activeSelectedCount > 0 ? 'Configuration Ready' : 'Configuration Incomplete'}
        subtitle={activeSelectedCount > 0 ? `${activeSelectedCount} wells selected for training analysis` : 'Add wells to proceed'}
      />

      {/* Search and Add Buttons */}
      <div style={{ display: 'flex', gap: '12px', margin: '16px 0', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
          <svg style={{ position: 'absolute', left: '12px', color: '#666' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Search wells..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: '#0D0D0D',
              border: '0.5px solid var(--border-default)',
              borderRadius: '8px',
              padding: '10px 12px 10px 34px',
              fontSize: '13px',
              color: 'var(--text-primary)',
              outline: 'none',
              fontFamily: 'Inter, sans-serif',
              boxSizing: 'border-box'
            }}
          />
          {searchQuery && (
            <span 
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '12px', cursor: 'pointer', color: '#888', fontSize: '12px' }}
            >
              ✕
            </span>
          )}
        </div>
        <Button label="+ Add Wells" variant="primary" onClick={() => setIsModalOpen(true)} />
      </div>

      {/* Table list */}
      <div style={{ border: '0.5px solid var(--border-default)', borderRadius: '8px', overflow: 'hidden', background: '#0D0D0D' }}>
        <div style={{ display: 'flex', padding: '12px 16px', background: 'var(--bg-surface)', borderBottom: '0.5px solid var(--border-default)' }}>
          <span style={{ flex: 1, fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Well Name</span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filteredWells.map((well) => (
            <TableRow
              key={well}
              wellName={well}
              variant={
                (selectionType === 'all' || selectedWells.includes(well)) ? 'selected' : 'default'
              }
              onToggle={() => toggleWell(well)}
              onDelete={(e) => handleDeleteWell(e, well)}
            />
          ))}
          {filteredWells.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>
              No wells match your search
            </div>
          )}
        </div>
      </div>

      {/* Footer list */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'Inter, sans-serif' }}>Total Rows: {wellsList.length}</span>
        <button
          onClick={handleSave}
          style={{
            background: 'var(--color-primary)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            boxShadow: '0 4px 15px rgba(127, 119, 221, 0.2)',
            transition: 'filter 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.filter = 'brightness(1.1)'}
          onMouseLeave={(e) => e.target.style.filter = 'none'}
        >
          Save Configuration
        </button>
      </div>

      <AddWellsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddFromModal}
        onRefresh={onRefresh}
      />
    </div>
  )
}

export default WellsTab