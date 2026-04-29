import { useState, useEffect } from "react";
import { Card, StatCard, Badge } from "../../components/ui";
import {
  Users,
  Home,
  DollarSign,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { reportsAPI } from "../../services/api";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [recentComplaints, setRecentComplaints] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, revenueRes, paymentsRes, complaintsRes] =
        await Promise.all([
          reportsAPI.getStats(),
          reportsAPI.getMonthlyRevenue(),
          fetch("http://localhost:5000/api/payments").then((res) => res.json()),
          fetch("http://localhost:5000/api/complaints").then((res) =>
            res.json(),
          ),
        ]);

      setStats(statsRes.data);
      setMonthlyData(revenueRes.data);
      setRecentPayments(paymentsRes.slice(-5).reverse());
      setRecentComplaints(
        complaintsRes.filter((c: any) => c.status !== "RESOLVED").slice(0, 5),
      );
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatKES = (v: number) => `KES ${v?.toLocaleString() || 0}`;

  const pieData = [
    { name: "Occupied", value: stats?.occupiedHouses || 0, color: "#10b981" },
    { name: "Vacant", value: stats?.vacantHouses || 0, color: "#f59e0b" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back! Here's your property overview.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Total Tenants"
          value={stats?.totalTenants || 0}
          color="blue"
        />
        <StatCard
          icon={<Home className="w-5 h-5" />}
          label="Occupancy Rate"
          value={`${stats?.occupancyRate || 0}%`}
          change={`${stats?.occupiedHouses || 0}/${stats?.totalHouses || 0} units`}
          color="green"
        />
        <StatCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Total Revenue"
          value={formatKES(stats?.totalRevenue || 0)}
          color="purple"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Pending Amount"
          value={formatKES(stats?.pendingPayments || 0)}
          change={`${stats?.openComplaints || 0} open complaints`}
          color="amber"
        />
      </div>

      {/* Charts - simplified for now */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Revenue Overview</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="#94a3b8"
                tickFormatter={(v) => `${v / 1000}k`}
              />
              <Tooltip
                formatter={(value: unknown) => formatKES(Number(value))}
              />
              <Bar
                dataKey="revenue"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                name="Revenue"
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Property Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-2">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: d.color }}
                />
                <span className="text-sm text-gray-600">
                  {d.name} ({d.value})
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Payments</h3>
          <div className="space-y-3">
            {recentPayments.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No recent payments
              </p>
            ) : (
              recentPayments.map((p: any) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-2 border-b border-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {p.tenant?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {p.date?.split("T")[0]}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      KES {p.amount?.toLocaleString()}
                    </p>
                    <Badge
                      variant={p.status === "PAID" ? "success" : "warning"}
                    >
                      {p.status?.toLowerCase()}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Open Issues</h3>
          <div className="space-y-3">
            {recentComplaints.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No open issues 🎉
              </p>
            ) : (
              recentComplaints.map((c: any) => (
                <div
                  key={c.id}
                  className="flex items-start justify-between py-2 border-b border-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {c.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {c.tenant?.name} • {c.category?.toLowerCase()}
                    </p>
                  </div>
                  <Badge variant={c.status === "OPEN" ? "warning" : "info"}>
                    {c.status?.toLowerCase()}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
