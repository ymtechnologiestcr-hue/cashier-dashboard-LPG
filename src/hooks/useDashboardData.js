import { useEffect, useState } from 'react';
import { getDashboardData } from '../services/dashboardService';
import { getCashFlowEntries } from '../services/cashierApi';

export function useDashboardData(range = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const startDate = range?.startDate || '';
  const endDate = range?.endDate || '';

  const fetchDashboard = () => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([
      getDashboardData({ startDate, endDate }),
      startDate ? getCashFlowEntries(startDate).catch(() => null) : Promise.resolve(null)
    ])
      .then(([dashboardData, cashFlowData]) => {
        if (active) {
          if (cashFlowData?.summary?.cashIn) {
            const cashInMetric = dashboardData.metrics?.find((m) => m.title === 'Total Cash In');
            if (cashInMetric) {
              cashInMetric.paymentMethods = {
                online: cashFlowData.summary.cashIn.online || 0,
                bank: cashFlowData.summary.cashIn.bank || 0,
              };
            }
          }
          if (cashFlowData?.summary?.cashOut) {
            const cashOutMetric = dashboardData.metrics?.find((m) => m.title === 'Total Cash Out');
            if (cashOutMetric) {
              cashOutMetric.paymentMethods = {
                online: cashFlowData.summary.cashOut.online || 0,
                bank: cashFlowData.summary.cashOut.bank || 0,
              };
            }
          }
          setData(dashboardData);
        }
      })
      .catch((err) => {
        if (active) setError(err.message || 'Unable to load dashboard');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  };

  useEffect(() => {
    const cleanup = fetchDashboard();
    return cleanup;
  }, [startDate, endDate]);

  return { data, loading, error, refresh: fetchDashboard };
}
