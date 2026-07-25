export const dashboardMock = {
  metrics: [
    {
      title: "Opening Balance",
      value: "₹45,000",
      description: "Started 08:42 AM",
      variant: "neutral",
      icon: "💼",
    },
    {
      title: "Total Cash In",
      value: "₹1,28,400",
      description: "36 transactions",
      variant: "success",
      badge: "+12.4%",
      icon: "⬆️",
    },
    {
      title: "Total Cash Out",
      value: "₹34,200",
      description: "14 expenses",
      variant: "danger",
      badge: "-3.2%",
      icon: "⬇️",
    },
    {
      title: "Current Balance",
      value: "₹1,39,200",
      description: "Live · last sync 2s ago",
      variant: "success",
      icon: "💚",
    },
  ],
  chart: {
    labels: ["9", "10", "11", "12", "1", "2", "3", "4", "5", "6", "7", "8"],
    cashIn: [28, 45, 60, 55, 68, 75, 82, 78, 85, 90, 95, 103],
    cashOut: [18, 24, 31, 29, 34, 35, 38, 37, 39, 41, 43, 45],
  },
  actions: [
    {
      title: "driver collections to verify",
      description: "₹30,600 awaiting confirmation",
      badge: "6",
      theme: "warning",
    },
    {
      title: "expense approvals pending",
      description: "Vehicle fuel · Office supplies",
      badge: "2",
      theme: "danger",
    },
    {
      title: "large transaction flagged",
      description: "₹48,000 · review required",
      badge: "1",
      theme: "info",
    },
  ],
  drivers: [
    {
      initials: "SP",
      name: "Suresh Patel",
      subtitle: "Route A · 24 cylinders",
      amount: "₹19,200",
      status: "Pending",
    },
    {
      initials: "MY",
      name: "Mahesh Yadav",
      subtitle: "Route B · 18 cylinders",
      amount: "₹14,000",
      status: "Pending",
    },
    {
      initials: "VS",
      name: "Vikram Singh",
      subtitle: "Route C · 22 cylinders",
      amount: "₹16,800",
      status: "Verified",
    },
    {
      initials: "AK",
      name: "Anil Kumar",
      subtitle: "Route D · 16 cylinders",
      amount: "₹12,200",
      status: "Pending",
    },
  ],
  approvals: [
    {
      label: "Suresh Patel",
      category: "Vehicle Fuel",
      amount: "₹850",
      time: "2h ago",
    },
    {
      label: "Office Supplies",
      category: "Stationery",
      amount: "₹1,240",
      time: "4h ago",
    },
  ],
  receipts: [
    { type: "UPI Payments", count: 28, amount: "₹42,600", icon: "📱" },
    { type: "Bank Transfer", count: 6, amount: "₹68,000", icon: "🏦" },
    { type: "Card Payments", count: 4, amount: "₹12,400", icon: "💳" },
  ],
};
