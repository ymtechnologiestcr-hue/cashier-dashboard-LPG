import { useState, useEffect } from 'react';
import ReportFilterBar from './ReportFilterBar';
import { getTotalCollectionReport } from '../../services/cashierApi';
import { exportToExcel, exportToPdf } from '../../utils/reportExportUtils';
import { toast } from 'sonner';

export default function TotalCollectionReport() {
  const [activeTab, setActiveTab] = useState('cash'); // 'cash' | 'upi' | 'online' | 'office' | 'service' | 'other'
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    cashCollection: { items: [], totalAmount: 0, driverSummary: {} },
    upiCollection: { items: [], totalAmount: 0, driverSummary: {} },
    onlineSales: { items: [], totalAmount: 0 },
    officeSales: { items: [], totalAmount: 0 },
    customerService: { items: [], totalAmount: 0 },
    otherReceipts: { items: [], totalAmount: 0 },
    grandTotal: { physicalCash: 0, allCollections: 0 },
  });
  const [filterInfo, setFilterInfo] = useState({ label: 'Today', startDate: '', endDate: '' });

  const [filters, setFilters] = useState({
    timeframe: 'today',
    startDate: '',
    endDate: '',
  });

  const fetchData = async (currentFilters) => {
    try {
      setLoading(true);
      const res = await getTotalCollectionReport(currentFilters);
      if (res?.success) {
        setData(res.data);
        if (res.filter) setFilterInfo(res.filter);
      }
    } catch (err) {
      console.error('Fetch total collection report error:', err);
      toast.error('Failed to load total collection report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(filters);
  }, []);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    fetchData(newFilters);
  };

  // Export to Excel
  const handleExportExcel = () => {
    try {
      const sheets = [];

      // 1. Cash Collection Sheet
      sheets.push({
        sheetName: 'Cash Collection',
        headers: ['Sl. No.', 'Date', 'Voucher Number', 'Driver Name', 'Cash Collection (₹)', 'Running Driver Total (₹)'],
        data: data.cashCollection.items.map((i) => [
          i.slNo,
          i.date,
          i.voucherNumber,
          i.driverName,
          i.cashCollection.toFixed(2),
          i.totalCashCollection.toFixed(2),
        ]),
        totals: ['GRAND TOTAL', '', '', '', data.cashCollection.totalAmount.toFixed(2), ''],
      });

      // 2. UPI Payment Sheet
      sheets.push({
        sheetName: 'UPI Collection',
        headers: ['Sl. No.', 'Date', 'Voucher Number', 'Driver Name', 'Total UPI Collection (₹)'],
        data: data.upiCollection.items.map((i) => [
          i.slNo,
          i.date,
          i.voucherNumber,
          i.driverName,
          i.totalUpiCollection.toFixed(2),
        ]),
        totals: ['GRAND TOTAL', '', '', '', data.upiCollection.totalAmount.toFixed(2)],
      });

      // 3. Online Sales Sheet
      sheets.push({
        sheetName: 'Online Sales',
        headers: ['Sl. No.', 'Date', 'Driver Name', 'Customer Name', 'Consumer Number', 'Total Amount (₹)'],
        data: data.onlineSales.items.map((i) => [
          i.slNo,
          i.date,
          i.driverName,
          i.customerName,
          i.consumerNumber,
          i.totalAmount.toFixed(2),
        ]),
        totals: ['GRAND TOTAL', '', '', '', '', data.onlineSales.totalAmount.toFixed(2)],
      });

      // 4. Office Sales Sheet
      sheets.push({
        sheetName: 'Office Sales',
        headers: ['Sl. No.', 'Date', 'Voucher Number', 'Customer Name', 'Consumer Number', 'Item Name', 'Quantity', 'Payment Mode', 'Total Amount (₹)'],
        data: data.officeSales.items.map((i) => [
          i.slNo,
          i.date,
          i.voucherNumber,
          i.customerName,
          i.consumerNumber,
          i.itemName,
          i.quantity,
          i.paymentMode,
          i.totalAmount.toFixed(2),
        ]),
        totals: ['GRAND TOTAL', '', '', '', '', '', '', '', data.officeSales.totalAmount.toFixed(2)],
      });

      // 5. Customer Service Sheet
      sheets.push({
        sheetName: 'Customer Service',
        headers: ['Sl. No.', 'Date', 'Receipt / Voucher #', 'Customer Name', 'Consumer Number', 'Service Type', 'Payment Mode', 'Amount Received (₹)'],
        data: data.customerService.items.map((i) => [
          i.slNo,
          i.date,
          i.voucherNumber,
          i.customerName,
          i.consumerNumber,
          i.serviceType,
          i.paymentMode,
          i.amountReceived.toFixed(2),
        ]),
        totals: ['GRAND TOTAL', '', '', '', '', '', '', data.customerService.totalAmount.toFixed(2)],
      });

      // 6. Other Receipts Sheet
      sheets.push({
        sheetName: 'Other Receipts',
        headers: ['Sl. No.', 'Date', 'Receipt / Voucher #', 'Received From', 'Receipt Description', 'Payment Mode', 'Amount Received (₹)'],
        data: data.otherReceipts.items.map((i) => [
          i.slNo,
          i.date,
          i.voucherNumber,
          i.receivedFrom,
          i.receiptDescription,
          i.paymentMode,
          i.amountReceived.toFixed(2),
        ]),
        totals: ['GRAND TOTAL', '', '', '', '', '', data.otherReceipts.totalAmount.toFixed(2)],
      });

      const filename = `Total_Collection_Report_${filterInfo.startDate || 'all'}_to_${filterInfo.endDate || 'all'}.xlsx`;
      exportToExcel({ filename, sheets });
      toast.success('Collection Report workbook exported to Excel');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export Excel');
    }
  };

  // Export to PDF
  const handleExportPdf = () => {
    try {
      let title = 'Collection Report';
      let subtitle = '';
      let headers = [];
      let tableData = [];
      let totals = [];

      if (activeTab === 'cash') {
        title = 'Cash Collection Report';
        subtitle = 'Driver-wise physical cash collected and settled into Cashier custody';
        headers = ['Sl.', 'Date', 'Voucher #', 'Driver Name', 'Cash Collection (₹)', 'Driver Total (₹)'];
        tableData = data.cashCollection.items.map((i) => [
          i.slNo,
          i.date,
          i.voucherNumber,
          i.driverName,
          i.cashCollection.toFixed(2),
          i.totalCashCollection.toFixed(2),
        ]);
        totals = ['GRAND TOTAL', '', '', '', data.cashCollection.totalAmount.toFixed(2), ''];
      } else if (activeTab === 'upi') {
        title = 'UPI Payment Collection Report';
        subtitle = 'Digital UPI payments collected via drivers - tracked separately from physical cash';
        headers = ['Sl.', 'Date', 'Voucher #', 'Driver Name', 'Total UPI Collection (₹)'];
        tableData = data.upiCollection.items.map((i) => [
          i.slNo,
          i.date,
          i.voucherNumber,
          i.driverName,
          i.totalUpiCollection.toFixed(2),
        ]);
        totals = ['GRAND TOTAL', '', '', '', data.upiCollection.totalAmount.toFixed(2)];
      } else if (activeTab === 'online') {
        title = 'Online Sales Collection Report';
        subtitle = 'Direct online consumer bookings (Bank / App) - excluded from physical drawer';
        headers = ['Sl.', 'Date', 'Driver / Route', 'Customer Name', 'Consumer #', 'Total Amount (₹)'];
        tableData = data.onlineSales.items.map((i) => [
          i.slNo,
          i.date,
          i.driverName,
          i.customerName,
          i.consumerNumber,
          i.totalAmount.toFixed(2),
        ]);
        totals = ['GRAND TOTAL', '', '', '', '', data.onlineSales.totalAmount.toFixed(2)];
      } else if (activeTab === 'office') {
        title = 'Office Sales Report';
        subtitle = 'Direct counter sales made through the Cashier office';
        headers = ['Sl.', 'Date', 'Voucher #', 'Customer', 'Consumer #', 'Item', 'Qty', 'Mode', 'Amount (₹)'];
        tableData = data.officeSales.items.map((i) => [
          i.slNo,
          i.date,
          i.voucherNumber,
          i.customerName,
          i.consumerNumber,
          i.itemName,
          i.quantity,
          i.paymentMode,
          i.totalAmount.toFixed(2),
        ]);
        totals = ['GRAND TOTAL', '', '', '', '', '', '', '', data.officeSales.totalAmount.toFixed(2)];
      } else if (activeTab === 'service') {
        title = 'Customer Service Collection Report';
        subtitle = 'PR Penalties, Name Changes, and New Connections receipts';
        headers = ['Sl.', 'Date', 'Voucher #', 'Customer', 'Consumer #', 'Service Type', 'Mode', 'Amount (₹)'];
        tableData = data.customerService.items.map((i) => [
          i.slNo,
          i.date,
          i.voucherNumber,
          i.customerName,
          i.consumerNumber,
          i.serviceType,
          i.paymentMode,
          i.amountReceived.toFixed(2),
        ]);
        totals = ['GRAND TOTAL', '', '', '', '', '', '', data.customerService.totalAmount.toFixed(2)];
      } else {
        title = 'Other Receipts Report';
        subtitle = 'Advances, due collections, and miscellaneous office receipts';
        headers = ['Sl.', 'Date', 'Voucher #', 'Received From', 'Description', 'Mode', 'Amount (₹)'];
        tableData = data.otherReceipts.items.map((i) => [
          i.slNo,
          i.date,
          i.voucherNumber,
          i.receivedFrom,
          i.receiptDescription,
          i.paymentMode,
          i.amountReceived.toFixed(2),
        ]);
        totals = ['GRAND TOTAL', '', '', '', '', '', data.otherReceipts.totalAmount.toFixed(2)];
      }

      exportToPdf({
        filename: `${activeTab}_Collection_Report.pdf`,
        title,
        subtitle,
        dateRange: filterInfo.label || 'Selected Period',
        headers,
        data: tableData,
        totals,
        orientation: 'portrait',
      });

      toast.success('Collection Report exported to PDF');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export PDF');
    }
  };

  return (
    <div className="report-submodule">
      {/* Header */}
      <div className="report-module-header">
        <div>
          <h2 className="report-module-title">Total Collection Report</h2>
          <p className="report-module-desc">
            Separate, reconcilable collection reports for Cash, UPI, Online Sales, Office Sales, Customer Service, and Other Receipts.
          </p>
        </div>
        <div className="report-header-actions">
          <button type="button" className="btn-export-excel" onClick={handleExportExcel}>
            <span className="export-icon">📊</span> Export Excel (All Sheets)
          </button>
          <button type="button" className="btn-export-pdf" onClick={handleExportPdf}>
            <span className="export-icon">📄</span> Export PDF
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <ReportFilterBar filters={filters} onFilterChange={handleFilterChange} loading={loading} />

      {/* KPI Cards */}
      <div className="report-kpi-grid">
        <div className="kpi-card kpi-highlight">
          <span className="kpi-label">Physical Cash Collection</span>
          <span className="kpi-value">₹{data.grandTotal.physicalCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          <span className="kpi-sub">Drawer Cash Inflow (reconciles with Cashier)</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">UPI Collection</span>
          <span className="kpi-value">₹{data.upiCollection.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          <span className="kpi-sub">{data.upiCollection.items.length} driver settlements</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Online / Direct Bookings</span>
          <span className="kpi-value">₹{data.onlineSales.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          <span className="kpi-sub">{data.onlineSales.items.length} online sales (direct company)</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">All Collections Combined</span>
          <span className="kpi-value text-accent">₹{data.grandTotal.allCollections.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          <span className="kpi-sub">Across all payment channels</span>
        </div>
      </div>

      {/* Reconciliation Rule Callout */}
      <div className="report-alert-banner">
        <span className="alert-icon">ℹ️</span>
        <div>
          <strong>Reconciliation Rule:</strong> Cash collection represents physical currency received into the Cashier drawer. UPI and Online sales are reported separately and strictly excluded from physical drawer balance to prevent double-counting.
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="report-tab-strip">
        <button
          type="button"
          className={`tab-strip-btn ${activeTab === 'cash' ? 'active' : ''}`}
          onClick={() => setActiveTab('cash')}
        >
          💵 Cash Collection ({data.cashCollection.items.length})
        </button>
        <button
          type="button"
          className={`tab-strip-btn ${activeTab === 'upi' ? 'active' : ''}`}
          onClick={() => setActiveTab('upi')}
        >
          📱 UPI Collection ({data.upiCollection.items.length})
        </button>
        <button
          type="button"
          className={`tab-strip-btn ${activeTab === 'online' ? 'active' : ''}`}
          onClick={() => setActiveTab('online')}
        >
          🌐 Online Sales ({data.onlineSales.items.length})
        </button>
        <button
          type="button"
          className={`tab-strip-btn ${activeTab === 'office' ? 'active' : ''}`}
          onClick={() => setActiveTab('office')}
        >
          🏢 Office Sales ({data.officeSales.items.length})
        </button>
        <button
          type="button"
          className={`tab-strip-btn ${activeTab === 'service' ? 'active' : ''}`}
          onClick={() => setActiveTab('service')}
        >
          🛠️ Customer Service ({data.customerService.items.length})
        </button>
        <button
          type="button"
          className={`tab-strip-btn ${activeTab === 'other' ? 'active' : ''}`}
          onClick={() => setActiveTab('other')}
        >
          📑 Other Receipts ({data.otherReceipts.items.length})
        </button>
      </div>

      {/* Data Table */}
      <div className="report-table-wrapper">
        {loading ? (
          <div className="report-loading-state">Loading collection records...</div>
        ) : (
          <>
            {/* 1. Cash Collection Table */}
            {activeTab === 'cash' && (
              data.cashCollection.items.length === 0 ? (
                <div className="report-empty-state">No cash collection records found for this period.</div>
              ) : (
                <table className="report-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Sl. No.</th>
                      <th>Date</th>
                      <th>Voucher Number</th>
                      <th>Driver Name</th>
                      <th className="text-right">Cash Collection</th>
                      <th className="text-right">Driver Total Collected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.cashCollection.items.map((item) => (
                      <tr key={`cash-${item.slNo}`}>
                        <td>{item.slNo}</td>
                        <td>{item.date}</td>
                        <td className="font-mono text-muted">{item.voucherNumber}</td>
                        <td className="font-medium">{item.driverName}</td>
                        <td className="text-right font-semibold text-primary">₹{item.cashCollection.toFixed(2)}</td>
                        <td className="text-right font-mono text-muted">₹{item.totalCashCollection.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="report-totals-row">
                      <td colSpan="4" className="font-bold">Grand Total Cash Collected ({data.cashCollection.items.length} records)</td>
                      <td className="text-right font-mono font-bold text-primary">₹{data.cashCollection.totalAmount.toFixed(2)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              )
            )}

            {/* 2. UPI Collection Table */}
            {activeTab === 'upi' && (
              data.upiCollection.items.length === 0 ? (
                <div className="report-empty-state">No UPI collection records found for this period.</div>
              ) : (
                <table className="report-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Sl. No.</th>
                      <th>Date</th>
                      <th>Voucher Number</th>
                      <th>Driver Name</th>
                      <th className="text-right">Total UPI Collection</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.upiCollection.items.map((item) => (
                      <tr key={`upi-${item.slNo}`}>
                        <td>{item.slNo}</td>
                        <td>{item.date}</td>
                        <td className="font-mono text-muted">{item.voucherNumber}</td>
                        <td className="font-medium">{item.driverName}</td>
                        <td className="text-right font-semibold text-primary">₹{item.totalUpiCollection.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="report-totals-row">
                      <td colSpan="4" className="font-bold">Grand Total UPI Collection ({data.upiCollection.items.length} records)</td>
                      <td className="text-right font-mono font-bold text-primary">₹{data.upiCollection.totalAmount.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              )
            )}

            {/* 3. Online Sales Table */}
            {activeTab === 'online' && (
              data.onlineSales.items.length === 0 ? (
                <div className="report-empty-state">No online sales transactions found for this period.</div>
              ) : (
                <table className="report-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Sl. No.</th>
                      <th>Date</th>
                      <th>Driver / Assigned Agent</th>
                      <th>Customer Name</th>
                      <th>Consumer Number</th>
                      <th className="text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.onlineSales.items.map((item) => (
                      <tr key={`online-${item.slNo}`}>
                        <td>{item.slNo}</td>
                        <td>{item.date}</td>
                        <td>{item.driverName}</td>
                        <td className="font-medium">{item.customerName}</td>
                        <td className="font-mono">{item.consumerNumber}</td>
                        <td className="text-right font-semibold text-primary">₹{item.totalAmount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="report-totals-row">
                      <td colSpan="5" className="font-bold">Grand Total Online Sales ({data.onlineSales.items.length} records)</td>
                      <td className="text-right font-mono font-bold text-primary">₹{data.onlineSales.totalAmount.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              )
            )}

            {/* 4. Office Sales Table */}
            {activeTab === 'office' && (
              data.officeSales.items.length === 0 ? (
                <div className="report-empty-state">No office walk-in sales found for this period.</div>
              ) : (
                <table className="report-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Sl. No.</th>
                      <th>Date</th>
                      <th>Voucher Number</th>
                      <th>Customer Name</th>
                      <th>Consumer Number</th>
                      <th>Item Name</th>
                      <th className="text-right">Quantity</th>
                      <th>Payment Mode</th>
                      <th className="text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.officeSales.items.map((item) => (
                      <tr key={`office-${item.slNo}`}>
                        <td>{item.slNo}</td>
                        <td>{item.date}</td>
                        <td className="font-mono text-muted">{item.voucherNumber}</td>
                        <td className="font-medium">{item.customerName}</td>
                        <td className="font-mono">{item.consumerNumber}</td>
                        <td>{item.itemName}</td>
                        <td className="text-right font-semibold">{item.quantity}</td>
                        <td>
                          <span className={`badge ${item.paymentMode === 'CASH' ? 'badge-cash' : 'badge-upi'}`}>
                            {item.paymentMode}
                          </span>
                        </td>
                        <td className="text-right font-semibold text-primary">₹{item.totalAmount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="report-totals-row">
                      <td colSpan="8" className="font-bold">Grand Total Office Sales ({data.officeSales.items.length} records)</td>
                      <td className="text-right font-mono font-bold text-primary">₹{data.officeSales.totalAmount.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              )
            )}

            {/* 5. Customer Service Table */}
            {activeTab === 'service' && (
              data.customerService.items.length === 0 ? (
                <div className="report-empty-state">No customer service receipts found for this period.</div>
              ) : (
                <table className="report-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Sl. No.</th>
                      <th>Date</th>
                      <th>Receipt / Voucher #</th>
                      <th>Customer Name</th>
                      <th>Consumer Number</th>
                      <th>Service Type</th>
                      <th>Payment Mode</th>
                      <th className="text-right">Amount Received</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.customerService.items.map((item) => (
                      <tr key={`service-${item.slNo}`}>
                        <td>{item.slNo}</td>
                        <td>{item.date}</td>
                        <td className="font-mono text-muted">{item.voucherNumber}</td>
                        <td className="font-medium">{item.customerName}</td>
                        <td className="font-mono">{item.consumerNumber}</td>
                        <td>
                          <span className="badge badge-domestic">{item.serviceType}</span>
                        </td>
                        <td>
                          <span className={`badge ${item.paymentMode === 'CASH' ? 'badge-cash' : 'badge-upi'}`}>
                            {item.paymentMode}
                          </span>
                        </td>
                        <td className="text-right font-semibold text-primary">₹{item.amountReceived.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="report-totals-row">
                      <td colSpan="7" className="font-bold">Grand Total Customer Service Receipts ({data.customerService.items.length} records)</td>
                      <td className="text-right font-mono font-bold text-primary">₹{data.customerService.totalAmount.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              )
            )}

            {/* 6. Other Receipts Table */}
            {activeTab === 'other' && (
              data.otherReceipts.items.length === 0 ? (
                <div className="report-empty-state">No other receipts found for this period.</div>
              ) : (
                <table className="report-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Sl. No.</th>
                      <th>Date</th>
                      <th>Receipt / Voucher #</th>
                      <th>Received From</th>
                      <th>Receipt Description</th>
                      <th>Payment Mode</th>
                      <th className="text-right">Amount Received</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.otherReceipts.items.map((item) => (
                      <tr key={`other-${item.slNo}`}>
                        <td>{item.slNo}</td>
                        <td>{item.date}</td>
                        <td className="font-mono text-muted">{item.voucherNumber}</td>
                        <td className="font-medium">{item.receivedFrom}</td>
                        <td>{item.receiptDescription}</td>
                        <td>
                          <span className={`badge ${item.paymentMode === 'CASH' ? 'badge-cash' : 'badge-upi'}`}>
                            {item.paymentMode}
                          </span>
                        </td>
                        <td className="text-right font-semibold text-primary">₹{item.amountReceived.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="report-totals-row">
                      <td colSpan="6" className="font-bold">Grand Total Other Receipts ({data.otherReceipts.items.length} records)</td>
                      <td className="text-right font-mono font-bold text-primary">₹{data.otherReceipts.totalAmount.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
