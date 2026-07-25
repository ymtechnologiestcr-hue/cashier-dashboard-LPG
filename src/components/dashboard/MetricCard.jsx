const metricIconConfig = {
  'Opening Balance': {
    backgroundColor: '#0486d3',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"></path>
        <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"></path>
      </svg>
    ),
  },
  'Total Cash In': {
    backgroundColor: '#00a159',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M16 7h6v6"></path>
        <path d="m22 7-8.5 8.5-5-5L2 17"></path>
      </svg>
    ),
  },
  'Total Cash Out': {
    backgroundColor: '#ee343b',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M16 17h6v-6"></path>
        <path d="m22 17-8.5-8.5-5 5L2 7"></path>
      </svg>
    ),
  },
  'Current Balance': {
    backgroundColor: '#00a159',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect width="20" height="12" x="2" y="6" rx="2"></rect>
        <circle cx="12" cy="12" r="2"></circle>
        <path d="M6 12h.01M18 12h.01"></path>
      </svg>
    ),
  },
};

function MetricCard({ metric, onClick, isClickable }) {
  const iconConfig = metricIconConfig[metric.title];

  return (
    <article
      className={`metric-card ${metric.variant || 'neutral'} ${isClickable ? 'clickable' : ''}`}
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="metric-card-header">
        <div
          className="metric-icon"
          style={{
            backgroundColor: iconConfig?.backgroundColor,
            color: iconConfig ? '#ffffff' : undefined,
          }}
        >
          {iconConfig?.icon || metric.icon}
        </div>
        {metric.badge ? <span className="metric-badge">{metric.badge}</span> : <span className="metric-spacer" />}
      </div>
      <p className="metric-title">{metric.title}</p>
      <p className="metric-value">{metric.value}</p>
      <p className="metric-description">{metric.description}</p>
      {metric.paymentMethods && (
        <div style={{ marginTop: '8px', fontSize: '0.85rem', display: 'flex', gap: '24px', opacity: 0.8 }}>
          <span>Online: ₹{metric.paymentMethods.online.toLocaleString('en-IN')}</span>
          <span>Bank: ₹{metric.paymentMethods.bank.toLocaleString('en-IN')}</span>
        </div>
      )}
    </article>
  );
}

export default MetricCard;
