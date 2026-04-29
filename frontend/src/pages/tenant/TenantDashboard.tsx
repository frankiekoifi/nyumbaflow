import { useState, useEffect } from "react";
import { User } from "../../types";
import { Card, Badge, StatCard } from "../../components/ui";
import { Home, DollarSign, AlertTriangle, Bell, Calendar } from "lucide-react";
import { housesAPI, paymentsAPI, noticesAPI } from "../../services/api";

export default function TenantDashboard({ user }: { user: User }) {
  const [house, setHouse] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [housesRes, paymentsRes, noticesRes] = await Promise.all([
        housesAPI.getAll(),
        paymentsAPI.getByTenant(user.id),
        noticesAPI.getByTenant(user.id),
      ]);

      // Find the house assigned to this tenant
      const userHouse = housesRes.data.find((h: any) => h.tenantId === user.id);
      setHouse(userHouse || null);
      setPayments(paymentsRes.data);
      setNotices(noticesRes.data);
    } catch (error) {
      console.error("Failed to fetch tenant dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkNoticeRead = async (noticeId: string) => {
    try {
      await noticesAPI.markAsRead(noticeId, user.id);
      await fetchData(); // Refresh to update read status
    } catch (error) {
      console.error("Failed to mark notice as read:", error);
    }
  };

  const totalPaid = payments
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + p.amount, 0);

  const pending = payments
    .filter((p) => p.status !== "PAID")
    .reduce((s, p) => s + p.amount, 0);

  const unreadNotices = notices.filter(
    (n) => !n.reads?.some((r: any) => r.tenantId === user.id),
  ).length;

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
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {user.name.split(" ")[0]}! 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Here's your rental overview
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Home className="w-5 h-5" />}
          label="My Unit"
          value={house?.name || "Not Assigned"}
          change={house ? `KES ${house.rent.toLocaleString()}/mo` : undefined}
          color="blue"
        />
        <StatCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Total Paid"
          value={`KES ${totalPaid.toLocaleString()}`}
          color="green"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Outstanding"
          value={`KES ${pending.toLocaleString()}`}
          color={pending > 0 ? "amber" : "green"}
        />
        <StatCard
          icon={<Bell className="w-5 h-5" />}
          label="Notices"
          value={`${unreadNotices} unread`}
          change={`${notices.length} total`}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unit details */}
        {house && (
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Home className="w-5 h-5 text-brand-500" />
              My Unit Details
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Unit</span>
                <span className="text-sm font-medium text-gray-900">
                  {house.name}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Address</span>
                <span className="text-sm font-medium text-gray-900">
                  {house.address}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Type</span>
                <Badge variant="info">{house.type?.toLowerCase()}</Badge>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Monthly Rent</span>
                <span className="text-sm font-bold text-brand-700">
                  KES {house.rent.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-500">Amenities</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {house.amenities?.map((a: string) => (
                    <span
                      key={a}
                      className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Recent Payments */}
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-500" />
            Recent Payments
          </h3>
          {payments.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No payment records yet.
            </p>
          ) : (
            <div className="space-y-3">
              {[...payments]
                .reverse()
                .slice(0, 5)
                .map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        KES {p.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {p.date?.split("T")[0]} • {p.method}
                      </p>
                    </div>
                    <Badge
                      variant={
                        p.status === "PAID"
                          ? "success"
                          : p.status === "PENDING"
                            ? "warning"
                            : "danger"
                      }
                    >
                      {p.status?.toLowerCase()}
                    </Badge>
                  </div>
                ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Notices */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-brand-500" />
          Latest Notices
        </h3>
        {notices.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No notices.</p>
        ) : (
          <div className="space-y-3">
            {[...notices]
              .reverse()
              .slice(0, 3)
              .map((n) => {
                const isRead = n.reads?.some(
                  (r: any) => r.tenantId === user.id,
                );
                return (
                  <div
                    key={n.id}
                    className={`p-4 rounded-xl border ${isRead ? "border-gray-100 bg-gray-50" : "border-brand-200 bg-brand-50"} cursor-pointer transition-colors`}
                    onClick={() => handleMarkNoticeRead(n.id)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-gray-900">
                        {n.title}
                      </h4>
                      {!isRead && <Badge variant="info">New</Badge>}
                    </div>
                    <p className="text-sm text-gray-600">
                      {n.message.slice(0, 100)}...
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {n.createdAt?.split("T")[0]}
                    </p>
                  </div>
                );
              })}
          </div>
        )}
      </Card>
    </div>
  );
}
