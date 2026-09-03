import { fetchJson } from './api.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

export async function getCashierDashboard(range = {}) {
  const params = new URLSearchParams();
  if (range?.startDate) params.append('startDate', range.startDate);
  if (range?.endDate) params.append('endDate', range.endDate);
  const query = params.toString();
  return fetchJson(`${API_BASE}/cashier/dashboard${query ? `?${query}` : ''}`);
}

export async function getCashFlowEntries(date) {
  return fetchJson(`${API_BASE}/cashier/cash-flow/entries?date=${date}`);
}

export async function getDriverCollections(page = 1, limit = 10, range = {}) {
  const rangeQuery = buildRangeQuery(range).replace('?', '&');
  return fetchJson(`${API_BASE}/cashier/driver-collections?page=${page}&limit=${limit}${rangeQuery}`);
}

export async function startCashierDay(payload) {
  return fetchJson(`${API_BASE}/cashier/opening`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function closeCashierDay(payload) {
  return fetchJson(`${API_BASE}/cashier/closing`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function recordOfficeSale(payload) {
  return fetchJson(`${API_BASE}/cashier/office-sale`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getTodayOfficeSales(range = {}) {
  return fetchJson(`${API_BASE}/cashier/office-sales/today${buildRangeQuery(range)}`);
}

export async function verifyDriverCollections(driverId) {
  return fetchJson(`${API_BASE}/cashier/driver-collections/${driverId}/verify`, {
    method: 'POST',
  });
}

export async function getDriverCollectionHistory(driverId, page = 1, limit = 5) {
  return fetchJson(`${API_BASE}/drivers/${driverId}/collection-history?page=${page}&limit=${limit}`);
}

export async function getLastClosingBalance() {
  return fetchJson(`${API_BASE}/cashier/opening/last-closing`);
}

export async function getClosingSummary() {
  return fetchJson(`${API_BASE}/cashier/closing/summary`);
}

export async function searchProducts(query) {
  return fetchJson(`${API_BASE}/drivers/products/search?search=${encodeURIComponent(query)}`);
}

export async function findCustomer(query) {
  return fetchJson(`${API_BASE}/cashier/customers/find?query=${encodeURIComponent(query)}`);
}

export async function recordCashierReceipt(payload) {
  return fetchJson(`${API_BASE}/cashier/receipt`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function recordOfficeExpense(payload) {
  return fetchJson(`${API_BASE}/cashier/office-expense`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function uploadSupportingDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem("cashier_auth_token");

  const response = await fetch(`${API_BASE}/upload/supporting-document`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(errorMessage || 'Failed to upload file');
  }

  return response.json();
}

export async function getTodayOfficeExpenses(range = {}) {
  return fetchJson(`${API_BASE}/cashier/office-expenses/today${buildRangeQuery(range)}`);
}

export async function getCashOutExpenseRequests(range = {}) {
  return fetchJson(`${API_BASE}/cashier/expense-requests${buildRangeQuery(range)}`);
}

export async function reviewCashOutExpenseRequest(expenseId, status, paymentDetails = {}) {
  return fetchJson(`${API_BASE}/cashier/expense-requests/${expenseId}`, {
    method: 'PUT',
    body: JSON.stringify({ status, ...paymentDetails }),
  });
}

export async function recordOtherPayment(payload) {
  return fetchJson(`${API_BASE}/cashier/other-payments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createCashierReceipt(payload) {
  return fetchJson(`${API_BASE}/cashier/receipts`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getRecentCashierReceipts(range = {}) {
  return fetchJson(`${API_BASE}/cashier/receipts/recent${buildRangeQuery(range)}`);
}

function buildRangeQuery(range = {}) {
  const params = new URLSearchParams();
  if (range?.startDate) params.append('startDate', range.startDate);
  if (range?.endDate) params.append('endDate', range.endDate);
  if (range?.date) params.append('date', range.date);
  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function getOtherPayments(range = {}) {
  return fetchJson(`${API_BASE}/cashier/other-payments${buildRangeQuery(range)}`);
}

export async function getOtherPaymentsSummary(range = {}) {
  return fetchJson(`${API_BASE}/cashier/other-payments/summary${buildRangeQuery(range)}`);
}

export async function getTodaysCashFlow(range = {}) {
  return fetchJson(`${API_BASE}/cashier/cash-flow/today${buildRangeQuery(range)}`);
}

export async function getCashierPenaltyRequests(status = 'ALL', range = {}) {
  const rangeQuery = buildRangeQuery(range).replace('?', '&');
  return fetchJson(`${API_BASE}/cashier/cashier-requests/pr-penalties?status=${encodeURIComponent(status)}${rangeQuery}`);
}

export async function collectCashierPenaltyRequest(requestId, payload) {
  return fetchJson(`${API_BASE}/cashier/cashier-requests/pr-penalties/${requestId}/collect`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function getCashierNameChangeRequests(status = 'ALL', range = {}) {
  const rangeQuery = buildRangeQuery(range).replace('?', '&');
  return fetchJson(`${API_BASE}/cashier/cashier-requests/name-changes?status=${encodeURIComponent(status)}${rangeQuery}`);
}

export async function collectCashierNameChangeRequest(requestId, payload) {
  return fetchJson(`${API_BASE}/cashier/cashier-requests/name-changes/${requestId}/collect`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function getCashierTransferVoucherRequests(status = 'ALL', range = {}) {
  const rangeQuery = buildRangeQuery(range).replace('?', '&');
  return fetchJson(`${API_BASE}/cashier/cashier-requests/transfer-vouchers?status=${encodeURIComponent(status)}${rangeQuery}`);
}

export async function collectCashierTransferVoucherRequest(requestId, payload) {
  return fetchJson(`${API_BASE}/cashier/cashier-requests/transfer-vouchers/${requestId}/collect`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function getCashierNewConnectionRequests(status = 'ALL', range = {}) {
  const rangeQuery = buildRangeQuery(range).replace('?', '&');
  return fetchJson(`${API_BASE}/cashier/cashier-requests/new-connections?status=${encodeURIComponent(status)}${rangeQuery}`);
}

export async function collectCashierNewConnectionRequest(requestId, payload) {
  return fetchJson(`${API_BASE}/cashier/cashier-requests/new-connections/${requestId}/collect`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
