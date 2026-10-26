import { useSearchParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import DailySalesReport from '../components/reports/DailySalesReport';
import TotalCollectionReport from '../components/reports/TotalCollectionReport';
import ExpensesReport from '../components/reports/ExpensesReport';
import ConsolidatedCashReport from '../components/reports/ConsolidatedCashReport';
import ClosingCashReport from '../components/reports/ClosingCashReport';

const reportModules = [
  {
    id: 'sales',
    name: 'Daily Sales Report',
    icon: '📊',
    desc: 'Domestic (5%) & Commercial (18%) GST reports with Excel/PDF export',
  },
  {
    id: 'collections',
    name: 'Total Collection Report',
    icon: '💰',
    desc: 'Cash, UPI, Online, Office Sales, Customer Service & Other Receipts',
  },
  {
    id: 'expenses',
    name: 'Expenses Report',
    icon: '📑',
    desc: 'Driver Expense Requests & Office Expense Entries with status audits',
  },
  {
    id: 'consolidated',
    name: 'Consolidated Cash Report',
    icon: '⚖️',
    desc: 'Reconcile Opening, Cash In, Cash Out, and Closing Balance',
  },
  {
    id: 'closing',
    name: 'Closing Cash with Denomination',
    icon: '💵',
    desc: 'Physical currency denomination count, reconciliation & closing history',
  },
];

export default function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'sales';

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="page-content">
        <Header />
        <main className="page-main reports-main">
          {/* Top Level Module Switcher Tabs */}
          <section className="reports-nav-section">
            <div className="reports-nav-tabs">
              {reportModules.map((mod) => (
                <button
                  key={mod.id}
                  type="button"
                  className={`reports-nav-tab-btn ${currentTab === mod.id ? 'active' : ''}`}
                  onClick={() => handleTabChange(mod.id)}
                >
                  <span className="tab-icon">{mod.icon}</span>
                  <div className="tab-text-box">
                    <span className="tab-name">{mod.name}</span>
                    <span className="tab-desc-preview">{mod.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Active Report Module View */}
          <section className="report-content-card">
            {currentTab === 'sales' && <DailySalesReport />}
            {currentTab === 'collections' && <TotalCollectionReport />}
            {currentTab === 'expenses' && <ExpensesReport />}
            {currentTab === 'consolidated' && <ConsolidatedCashReport />}
            {currentTab === 'closing' && <ClosingCashReport />}
          </section>
        </main>
      </div>
    </div>
  );
}
