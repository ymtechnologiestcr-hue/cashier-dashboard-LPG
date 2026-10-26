import { useState, useEffect } from 'react';

/**
 * ReportFilterBar
 * Unified interactive filter bar supporting Quick Presets, Date Pickers, Driver, Product, and Category filters.
 */

export default function ReportFilterBar({
  filters,
  onFilterChange,
  showDriver = false,
  driversList = [],
  showProduct = false,
  productsList = [],
  showCategory = false,
  showStatus = false,
  statusOptions = [],
  loading = false,
}) {
  const getTodayStr = () => {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  };

  const today = getTodayStr();

  const [activePreset, setActivePreset] = useState(filters.timeframe || 'today');
  const [startDate, setStartDate] = useState(filters.startDate || today);
  const [endDate, setEndDate] = useState(filters.endDate || today);
  const [driverId, setDriverId] = useState(filters.driverId || 'ALL');
  const [productId, setProductId] = useState(filters.productId || 'ALL');
  const [category, setCategory] = useState(filters.category || 'ALL');
  const [status, setStatus] = useState(filters.status || 'ALL');

  useEffect(() => {
    if (filters.timeframe) setActivePreset(filters.timeframe);
    if (filters.startDate) setStartDate(filters.startDate);
    if (filters.endDate) setEndDate(filters.endDate);
    if (filters.driverId) setDriverId(filters.driverId);
    if (filters.productId) setProductId(filters.productId);
    if (filters.category) setCategory(filters.category);
    if (filters.status) setStatus(filters.status);
  }, [filters]);

  const handlePresetClick = (preset) => {
    setActivePreset(preset);
    let start = today;
    let end = today;

    if (preset === 'today') {
      start = today;
      end = today;
    } else if (preset === 'yesterday') {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      const yStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
      start = yStr;
      end = yStr;
    } else if (preset === 'week') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      start = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
      end = today;
    } else if (preset === 'month') {
      const now = new Date();
      start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      end = today;
    }

    setStartDate(start);
    setEndDate(end);

    onFilterChange({
      timeframe: preset,
      startDate: start,
      endDate: end,
      driverId,
      productId,
      category,
      status,
    });
  };

  const handleApply = (e) => {
    if (e) e.preventDefault();
    onFilterChange({
      timeframe: activePreset,
      startDate,
      endDate,
      driverId,
      productId,
      category,
      status,
    });
  };

  const handleReset = () => {
    setActivePreset('today');
    setStartDate(today);
    setEndDate(today);
    setDriverId('ALL');
    setProductId('ALL');
    setCategory('ALL');
    setStatus('ALL');
    onFilterChange({
      timeframe: 'today',
      startDate: today,
      endDate: today,
      driverId: 'ALL',
      productId: 'ALL',
      category: 'ALL',
      status: 'ALL',
    });
  };

  return (
    <div className="report-filter-container">
      {/* Quick Timeframe Buttons */}
      <div className="filter-presets-row">
        <span className="preset-label">Period:</span>
        <button
          type="button"
          className={`preset-btn ${activePreset === 'today' ? 'active' : ''}`}
          onClick={() => handlePresetClick('today')}
        >
          Today
        </button>
        <button
          type="button"
          className={`preset-btn ${activePreset === 'yesterday' ? 'active' : ''}`}
          onClick={() => handlePresetClick('yesterday')}
        >
          Yesterday
        </button>
        <button
          type="button"
          className={`preset-btn ${activePreset === 'week' ? 'active' : ''}`}
          onClick={() => handlePresetClick('week')}
        >
          This Week
        </button>
        <button
          type="button"
          className={`preset-btn ${activePreset === 'month' ? 'active' : ''}`}
          onClick={() => handlePresetClick('month')}
        >
          This Month
        </button>
        <button
          type="button"
          className={`preset-btn ${activePreset === 'custom' ? 'active' : ''}`}
          onClick={() => setActivePreset('custom')}
        >
          Custom Period
        </button>
      </div>

      {/* Inputs Form Row */}
      <form onSubmit={handleApply} className="filter-fields-grid">
        <div className="form-field-compact">
          <label>From Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setActivePreset('custom');
            }}
          />
        </div>

        <div className="form-field-compact">
          <label>To Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setActivePreset('custom');
            }}
          />
        </div>

        {showDriver && (
          <div className="form-field-compact">
            <label>Delivery Boy</label>
            <select value={driverId} onChange={(e) => setDriverId(e.target.value)}>
              <option value="ALL">All Delivery Boys</option>
              {driversList.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {showProduct && (
          <div className="form-field-compact">
            <label>Item / Cylinder</label>
            <select value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="ALL">All Items</option>
              {productsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.type})
                </option>
              ))}
            </select>
          </div>
        )}

        {showCategory && (
          <div className="form-field-compact">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="ALL">All Categories</option>
              <option value="DOMESTIC">Domestic (5% GST)</option>
              <option value="COMMERCIAL">Commercial (18% GST)</option>
            </select>
          </div>
        )}

        {showStatus && (
          <div className="form-field-compact">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="ALL">All Statuses</option>
              {statusOptions.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="filter-button-group">
          <button type="button" className="btn-filter-reset" onClick={handleReset}>
            Reset
          </button>
          <button type="submit" className="btn-filter-apply" disabled={loading}>
            {loading ? 'Filtering...' : 'Apply Filters'}
          </button>
        </div>
      </form>
    </div>
  );
}
