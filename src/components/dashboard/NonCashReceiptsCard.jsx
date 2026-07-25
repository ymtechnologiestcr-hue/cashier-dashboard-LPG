const receiptIconConfig = {
  'UPI / Online': {
    backgroundColor: '#0486d3',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect>
        <path d="M12 18h.01"></path>
      </svg>
    ),
  },
  'Bank / Card': {
    backgroundColor: '#00a159',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10 12h4"></path>
        <path d="M10 8h4"></path>
        <path d="M14 21v-3a2 2 0 0 0-4 0v3"></path>
        <path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"></path>
        <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"></path>
      </svg>
    ),
  },
  'UPI Payments': {
    backgroundColor: '#0486d3',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect>
        <path d="M12 18h.01"></path>
      </svg>
    ),
  },
  'Bank Transfer': {
    backgroundColor: '#00a159',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10 12h4"></path>
        <path d="M10 8h4"></path>
        <path d="M14 21v-3a2 2 0 0 0-4 0v3"></path>
        <path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"></path>
        <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"></path>
      </svg>
    ),
  },
  'Card Payments': {
    backgroundColor: '#2e1e01',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect width="20" height="14" x="2" y="5" rx="2"></rect>
        <line x1="2" x2="22" y1="10" y2="10"></line>
      </svg>
    ),
  },
};

function NonCashReceiptsCard({ receipts }) {
  const total = receipts.reduce((sum, item) => {
    // some amounts might be just numbers or undefined
    if (!item.amount) return sum;
    const value = Number(String(item.amount).replace(/[^0-9.-]+/g, ''));
    return sum + (isNaN(value) ? 0 : value);
  }, 0);

  return (
    <section className="summary-card">
      <div className="card-heading summary-heading-block">
        <div>
          <p className="summary-title">Non-Cash Receipts</p>
          <h2 className="summary-subtitle">Excluded from cash balance</h2>
        </div>
      </div>
      <div className="receipt-list-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', marginBottom: '8px', borderBottom: '1px solid #f3f4f6', fontSize: '12px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>
          <span style={{ marginLeft: '48px' }}>Type</span>
          <span>Amount</span>
        </div>
        {receipts.map((item, index) => {
          const typeKey = item.type || item.title || item.name || 'Unknown Type';
          const iconConfig = receiptIconConfig[typeKey];

          return (
          <div key={index} className="receipt-row">
            <div
              className="receipt-icon"
              style={{
                backgroundColor: iconConfig?.backgroundColor || '#eef2ff',
                color: '#ffffff',
              }}
            >
              {iconConfig?.icon || item.icon}
            </div>
            <div className="receipt-details">
              <p className="receipt-title" style={{ color: '#111827' }}>{typeKey}</p>
              <p className="receipt-subtitle">{item.count} transactions</p>
            </div>
            <p className="expense-amount receipt-amount">{item.amount}</p>
          </div>
          );
        })}
      </div>
      <div className="receipt-total">
        <span className="receipt-total-label">Total</span>
        <strong>₹{total.toLocaleString('en-IN')}</strong>
      </div>
    </section>
  );
}

export default NonCashReceiptsCard;
