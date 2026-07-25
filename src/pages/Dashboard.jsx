import { useState } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { useDashboardData } from '../hooks/useDashboardData';
import MetricCard from '../components/dashboard/MetricCard';
import ChartCard from '../components/dashboard/ChartCard';
import PendingActionsCard from '../components/dashboard/PendingActionsCard';
import DriverCollectionsCard from '../components/dashboard/DriverCollectionsCard';
import ExpenseApprovalsCard from '../components/dashboard/ExpenseApprovalsCard';
import NonCashReceiptsCard from '../components/dashboard/NonCashReceiptsCard';
import CurrentBalanceModal from '../components/dashboard/CurrentBalanceModal';

// Local (not UTC) YYYY-MM-DD so the default range matches the cashier's calendar day.
function todayIso() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

function Dashboard() {
  // Default the date filter to today so the dashboard opens on today's data.
  const [dateRange, setDateRange] = useState(() => {
    const today = todayIso();
    return { startDate: today, endDate: today };
  });
  const { data, loading, error, refresh } = useDashboardData(dateRange);
  const [isBalanceModalOpen, setBalanceModalOpen] = useState(false);

  // Extract available cash from the metrics
  const currentBalanceStr = data?.metrics?.find((m) => m.title === 'Current Balance')?.value || '₹0';
  const availableCash = Number(currentBalanceStr.replace(/[^0-9.-]+/g, '')) || 0;

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="page-content">
        <Header dateRange={dateRange} onApplyRange={setDateRange} />
        <main className="dashboard-grid">
          {loading ? (
            <div className="loading-shell">Loading dashboard…</div>
          ) : error ? (
            <div className="error-shell">{error}</div>
          ) : (
            <>
              <section className="summary-row">
                {data.metrics.map((metric) => (
                  <MetricCard
                    key={metric.title}
                    metric={metric}
                    isClickable={metric.title === 'Current Balance'}
                    onClick={() => {
                      if (metric.title === 'Current Balance') {
                        setBalanceModalOpen(true);
                      }
                    }}
                  />
                ))}
              </section>

              <section className="dashboard-main">
                <ChartCard chart={data.chart} metrics={data.metrics} />
                {/* <PendingActionsCard actions={data.actions} /> */}
                <ExpenseApprovalsCard 
                  approvals={data.approvals} 
                  onSuccess={refresh} 
                  availableCash={availableCash} 
                />

              </section>

              <section className="dashboard-subgrid">
                <DriverCollectionsCard drivers={data.drivers} />
                <NonCashReceiptsCard receipts={data.receipts} />
              </section>

              {isBalanceModalOpen && (
                <CurrentBalanceModal
                  date={dateRange.startDate}
                  metrics={data.metrics}
                  onClose={() => setBalanceModalOpen(false)}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
