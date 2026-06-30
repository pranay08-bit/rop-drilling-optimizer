function TabBar({ tabs, activeTab, onTabChange }) {
  return (
    <div style={{
      display: 'flex',
      borderBottom: '0.5px solid var(--border-default)',
      backgroundColor: 'var(--bg-dark)',
    }}>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            padding: '12px 16px',
            fontSize: '13px',
            cursor: 'pointer',
            color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {tab.label}
          {tab.count && (
            <span style={{
              background: tab.id === 'wells' ? 'var(--color-success)' : 'var(--color-primary)',
              color: '#fff',
              borderRadius: '8px',
              fontSize: '10px',
              padding: '1px 6px',
              fontWeight: '500',
            }}>
              {tab.count}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

export default TabBar