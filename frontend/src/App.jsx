import { useState, useEffect } from 'react'
import TabBar from './components/TabBar'
import Home from './pages/Home'
import WellsTab from './pages/WellsTab'
import FormationTopsTab from './pages/FormationTopsTab'
import AnalysisLimitsTab from './pages/AnalysisLimitsTab'
import ResultsDashboard from './pages/ResultsDashboard'
import PipelineRunning from './pages/PipelineRunning'
import Modal from './components/Modal'
import { getConfig, saveConfig } from './api/config'
import { getPipelineStatus } from './api/pipeline'

const tabs = [
  { id: 'wells', label: 'Wells', count: 0 },
  { id: 'formation', label: 'Formation Tops', count: 0 },
  { id: 'limits', label: 'Analysis Limits' },
]

function App() {
  const [activeTab, setActiveTab] = useState('wells')
  const [screen, setScreen] = useState('home') // home | setup | pipeline | results
  const [showModal, setShowModal] = useState(null) // null | 'success' | 'error' | 'save_success'
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [pipelineStatus, setPipelineStatus] = useState('idle')

  const navigateToScreen = (newScreen, replace = false) => {
    setScreen(newScreen)
    try {
      if (replace) {
        window.history.replaceState({ screen: newScreen }, '')
      } else {
        window.history.pushState({ screen: newScreen }, '')
      }
    } catch (e) {
      console.warn('History API not supported or blocked in this environment', e)
    }
  }

  useEffect(() => {
    try {
      if (!window.history.state) {
        window.history.replaceState({ screen: 'home' }, '')
      }
    } catch (e) {
      console.warn('History API not supported or blocked in this environment', e)
    }

    const handlePopState = (event) => {
      if (event.state && event.state.screen) {
        setScreen(event.state.screen)
      } else {
        setScreen('home')
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])


  const loadConfig = async () => {
    setLoading(true)
    try {
      const res = await getConfig()
      if (res.status === 'success') {
        setConfig(res)
      } else {
        setErrorMsg(res.message || 'Failed to load configuration')
      }
    } catch (err) {
      console.error(err)
      setErrorMsg('Failed to connect to backend server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  // Poll pipeline status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await getPipelineStatus()
        if (res && res.status) {
          setPipelineStatus(res.status)
        }
      } catch (err) {
        console.error('Error fetching pipeline status:', err)
      }
    }
    fetchStatus()
    const interval = setInterval(fetchStatus, 4000)
    return () => clearInterval(interval)
  }, [])

  const handleSaveConfig = async (updatedFields, showSuccessModal = true) => {
    if (!config) return
    const payload = {
      wells: updatedFields.selected_wells ?? config.selected_wells,
      well_definitions: updatedFields.well_definitions ?? config.well_definitions,
      formations: updatedFields.formations ?? config.formations,
      selected_formations: updatedFields.selected_formations ?? config.selected_formations,
      limits: updatedFields.limits ?? config.limits,
    }
    try {
      const res = await saveConfig(payload)
      if (res.status === 'success') {
        const newConfig = await getConfig()
        if (newConfig.status === 'success') {
          setConfig(newConfig)
        }
        if (showSuccessModal) {
          setShowModal('save_success')
        }
      } else {
        setErrorMsg(res.message || 'Failed to save config')
        setShowModal('error')
      }
    } catch (err) {
      console.error(err)
      setErrorMsg('Network error saving configuration.')
      setShowModal('error')
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)', gap: '16px'
      }}>
        <div className="spinner" style={{
          width: '40px', height: '40px', border: '3px solid #333', borderTopColor: 'var(--color-primary)',
          borderRadius: '50%', animation: 'spin 1s linear infinite'
        }} />
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Loading configuration...</p>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    )
  }

  // Set counts dynamically on tabs
  const dynamicTabs = tabs.map(t => {
    if (t.id === 'wells') return { ...t, count: config?.available_wells?.length || 0 }
    if (t.id === 'formation') return { ...t, count: config?.formations?.length || 0 }
    return t
  })

  return (
    <div style={{ backgroundColor: 'var(--bg-dark)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Sticky Global Navigation Navbar */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 32px',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '0.5px solid var(--border-default)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div 
          onClick={() => navigateToScreen('home')} 
          style={{ 
            fontSize: '14px', 
            fontWeight: '700', 
            color: 'var(--text-primary)', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            letterSpacing: '0.5px'
          }}
        >
          <span style={{ color: 'var(--color-primary)', fontSize: '16px' }}>⚡</span>
          ROP OPTIMIZER
        </div>

        <div style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
          <span 
            onClick={() => navigateToScreen('home')} 
            style={{
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              color: screen === 'home' ? 'var(--text-primary)' : 'var(--text-secondary)',
              transition: 'color 0.2s',
              borderBottom: screen === 'home' ? '2.5px solid var(--color-primary)' : '2.5px solid transparent',
              paddingBottom: '4px',
              marginTop: '2.5px'
            }}
          >
            Home
          </span>

          <span 
            onClick={() => navigateToScreen('setup')} 
            style={{
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              color: screen === 'setup' ? 'var(--text-primary)' : 'var(--text-secondary)',
              transition: 'color 0.2s',
              borderBottom: screen === 'setup' ? '2.5px solid var(--color-primary)' : '2.5px solid transparent',
              paddingBottom: '4px',
              marginTop: '2.5px'
            }}
          >
            Setup
          </span>

          <span 
            onClick={() => navigateToScreen('pipeline')} 
            style={{
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              color: screen === 'pipeline' ? 'var(--text-primary)' : 'var(--text-secondary)',
              transition: 'color 0.2s',
              borderBottom: screen === 'pipeline' ? '2.5px solid var(--color-primary)' : '2.5px solid transparent',
              paddingBottom: '4px',
              marginTop: '2.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Pipeline
            {pipelineStatus === 'running' && (
              <span className="nav-pulse" style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-info)',
                boxShadow: '0 0 6px var(--color-info)'
              }} />
            )}
          </span>

          <span 
            onClick={() => navigateToScreen('results')} 
            style={{
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              color: screen === 'results' ? 'var(--text-primary)' : 'var(--text-secondary)',
              transition: 'color 0.2s',
              borderBottom: screen === 'results' ? '2.5px solid var(--color-primary)' : '2.5px solid transparent',
              paddingBottom: '4px',
              marginTop: '2.5px'
            }}
          >
            Analytics
          </span>
        </div>

        <style>{`
          .nav-pulse {
            animation: pulse 1.5s infinite;
          }
          @keyframes pulse {
            0% { transform: scale(0.9); opacity: 0.6; }
            50% { transform: scale(1.25); opacity: 1; }
            100% { transform: scale(0.9); opacity: 0.6; }
          }
        `}</style>
      </nav>

      {/* Main Screen Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {screen === 'home' && (
          <Home onNavigate={navigateToScreen} />
        )}

        {screen === 'setup' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <TabBar tabs={dynamicTabs} activeTab={activeTab} onTabChange={setActiveTab} />
            
            <div style={{ flex: 1 }}>
              {activeTab === 'wells' && (
                <WellsTab
                  availableWells={config?.available_wells || []}
                  initialSelected={config?.selected_wells || []}
                  initialDefinitions={config?.well_definitions || []}
                  onSave={(wells, definitions, showSuccessModal) => handleSaveConfig({ selected_wells: wells, well_definitions: definitions }, showSuccessModal)}
                  onRefresh={loadConfig}
                />
              )}
              {activeTab === 'formation' && (
                <FormationTopsTab
                  initialFormations={config?.formations || []}
                  initialSelectedFormations={config?.selected_formations || config?.formations || []}
                  onSave={(allFormations, selectedFormations, showSuccessModal) => 
                    handleSaveConfig({ formations: allFormations, selected_formations: selectedFormations }, showSuccessModal)
                  }
                />
              )}
              {activeTab === 'limits' && (
                <AnalysisLimitsTab
                  initialLimits={config?.limits || {}}
                  onSave={(limits) => handleSaveConfig({ limits })}
                />
              )}
            </div>

            <div style={{ padding: '24px', display: 'flex', gap: '12px', borderTop: '0.5px solid var(--border-default)', background: 'var(--bg-surface)' }}>
              <button onClick={() => navigateToScreen('pipeline')} style={{
                background: 'var(--color-primary)', color: '#fff', border: 'none',
                borderRadius: '8px', padding: '10px 18px', fontSize: '13px', cursor: 'pointer',
                fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                ▶ Run Optimization Pipeline
              </button>
              <button onClick={() => {
                setErrorMsg("Training data has missing values in column 'Torque'. Please clean the dataset.")
                setShowModal('error')
              }} style={{
                background: 'transparent', color: 'var(--text-secondary)',
                border: '0.5px solid var(--border-default)', borderRadius: '8px',
                padding: '10px 18px', fontSize: '13px', cursor: 'pointer',
              }}>
                Test Error Modal
              </button>
            </div>
          </div>
        )}

        {screen === 'pipeline' && (
          <PipelineRunning
            onComplete={() => navigateToScreen('results', true)}
            onCancel={() => navigateToScreen('home')}
          />
        )}

        {screen === 'results' && (
          <ResultsDashboard
            onBack={() => navigateToScreen('home')}
          />
        )}
      </div>

      {showModal === 'save_success' && (
        <Modal
          variant="success"
          title="Configuration Saved!"
          message="Your drilling parameter settings and selected wells have been written to the configuration file successfully."
          primaryLabel="Dismiss"
          onPrimary={() => setShowModal(null)}
        />
      )}

      {showModal === 'error' && (
        <Modal
          variant="error"
          title="Operation Failed"
          message="An error occurred while updating or saving settings."
          errorDetail={errorMsg}
          primaryLabel="Dismiss"
          onPrimary={() => setShowModal(null)}
        />
      )}
    </div>
  )
}

export default App