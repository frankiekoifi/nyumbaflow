import { useState, useEffect } from "react";
import { Card, Badge } from "../../components/ui";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Users,
  Home,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import {
  reportsAPI,
  paymentsAPI,
  complaintsAPI,
  housesAPI,
  tenantsAPI,
} from "../../services/api";

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [houses, setHouses] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [
        statsRes,
        revenueRes,
        paymentsRes,
        complaintsRes,
        housesRes,
        tenantsRes,
      ] = await Promise.all([
        reportsAPI.getStats(),
        reportsAPI.getMonthlyRevenue(),
        paymentsAPI.getAll(),
        complaintsAPI.getAll(),
        housesAPI.getAll(),
        tenantsAPI.getAll(),
      ]);

      setStats(statsRes.data);
      setMonthlyData(revenueRes.data);
      setPayments(paymentsRes.data);
      setComplaints(complaintsRes.data);
      setHouses(housesRes.data);
      setTenants(tenantsRes.data);
    } catch (error) {
      console.error("Failed to fetch reports data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Payment method distribution
  const methodData = [
    {
      name: "M-Pesa",
      value: payments.filter((p: any) => p.method === "MPESA").length,
      color: "#10b981",
    },
    {
      name: "Bank",
      value: payments.filter((p: any) => p.method === "BANK").length,
      color: "#3b82f6",
    },
    {
      name: "Cash",
      value: payments.filter((p: any) => p.method === "CASH").length,
      color: "#f59e0b",
    },
  ];

  // Complaint categories
  const categories = [
    "PLUMBING",
    "ELECTRICAL",
    "STRUCTURAL",
    "PEST",
    "SECURITY",
    "OTHER",
  ];
  const complaintData = categories.map((cat) => ({
    category: cat.toLowerCase(),
    count: complaints.filter((c: any) => c.category === cat).length,
  }));

  // House type distribution
  const houseTypes = ["APARTMENT", "BEDSITTER", "SINGLE", "DOUBLE", "STUDIO"];
  const houseTypeData = houseTypes.map((t, index) => ({
    type: t.toLowerCase(),
    count: houses.filter((h: any) => h.type === t).length,
    color: ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444"][index],
  }));

  // Tenant payment performance
  const tenantPerformance = tenants
    .map((t: any) => {
      const tenantPayments = payments.filter((p: any) => p.tenantId === t.id);
      const paid = tenantPayments.filter(
        (p: any) => p.status === "PAID",
      ).length;
      const total = tenantPayments.length;
      const rate = total > 0 ? Math.round((paid / total) * 100) : 0;
      const house = houses.find((h: any) => h.tenantId === t.id);
      const arrears = tenantPayments
        .filter((p: any) => p.status !== "PAID")
        .reduce((s: number, p: any) => s + p.amount, 0);
      return {
        name: t.name,
        rate,
        paid,
        total,
        house: house?.name || "N/A",
        arrears,
      };
    })
    .sort((a, b) => a.rate - b.rate);

  const formatKES = (v: number) => `KES ${v?.toLocaleString() || 0}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        Loading reports...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Reports & Analytics
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Comprehensive overview of your property portfolio
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 text-center">
          <Users className="w-5 h-5 text-brand-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900">
            {stats?.totalTenants || 0}
          </p>
          <p className="text-xs text-gray-500">Tenants</p>
        </Card>
        <Card className="p-4 text-center">
          <Home className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900">
            {stats?.occupancyRate || 0}%
          </p>
          <p className="text-xs text-gray-500">Occupancy</p>
        </Card>
        <Card className="p-4 text-center">
          <DollarSign className="w-5 h-5 text-purple-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900">
            KES {((stats?.totalRevenue || 0) / 1000).toFixed(0)}K
          </p>
          <p className="text-xs text-gray-500">Revenue</p>
        </Card>
        <Card className="p-4 text-center">
          <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900">
            {stats?.openComplaints || 0}
          </p>
          <p className="text-xs text-gray-500">Open Issues</p>
        </Card>
        <Card className="p-4 text-center">
          <TrendingUp className="w-5 h-5 text-rose-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900">
            KES {((stats?.pendingPayments || 0) / 1000).toFixed(0)}K
          </p>
          <p className="text-xs text-gray-500">Arrears</p>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="#94a3b8"
                tickFormatter={(v) => `${v / 1000}k`}
              />
              <Tooltip formatter={(v: unknown) => formatKES(Number(v))} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6" }}
                name="Revenue"
              />
              <Line
                type="monotone"
                dataKey="pending"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ fill: "#f59e0b" }}
                name="Pending"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Payment Methods</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={methodData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {methodData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Complaints by Category
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={complaintData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="category"
                tick={{ fontSize: 12 }}
                width={80}
              />
              <Tooltip />
              <Bar
                dataKey="count"
                fill="#8b5cf6"
                radius={[0, 4, 4, 0]}
                name="Count"
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Property Types</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={houseTypeData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                dataKey="count"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {houseTypeData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Tenant Payment Performance */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          Tenant Payment Performance
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                  Tenant
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                  Unit
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                  Payment Rate
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                  Paid/Total
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                  Arrears
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                  Risk
                </th>
              </tr>
            </thead>
            <tbody>
              {tenantPerformance.map((t, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-50 hover:bg-gray-50"
                >
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">
                    {t.name}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{t.house}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${t.rate >= 80 ? "bg-emerald-500" : t.rate >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
                          style={{ width: `${t.rate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{t.rate}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {t.paid}/{t.total}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">
                    KES {t.arrears.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={
                        t.rate >= 80
                          ? "success"
                          : t.rate >= 50
                            ? "warning"
                            : "danger"
                      }
                    >
                      {t.rate >= 80 ? "Low" : t.rate >= 50 ? "Medium" : "High"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
