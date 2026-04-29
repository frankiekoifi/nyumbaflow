import { useState, useCallback, useEffect } from "react";
import { User } from "../../types";
import { Card, Badge, EmptyState } from "../../components/ui";
import { Bell, CheckCheck } from "lucide-react";
import { noticesAPI } from "../../services/api";

export default function TenantNotices({ user }: { user: User }) {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await noticesAPI.getByTenant(user.id);
      setNotices(response.data);
    } catch (error) {
      console.error("Failed to fetch notices:", error);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const markRead = async (noticeId: string) => {
    try {
      await noticesAPI.markAsRead(noticeId, user.id);
      await fetchNotices(); // Refresh the list
    } catch (error) {
      console.error("Failed to mark notice as read:", error);
    }
  };

  const typeConfig: Record<
    string,
    {
      icon: string;
      border: string;
      badgeVariant:
        | "info"
        | "warning"
        | "danger"
        | "default"
        | "purple"
        | "success";
    }
  > = {
    GENERAL: { icon: "📢", border: "border-l-blue-500", badgeVariant: "info" },
    RENT_REMINDER: {
      icon: "💰",
      border: "border-l-amber-500",
      badgeVariant: "warning",
    },
    MAINTENANCE: {
      icon: "🔧",
      border: "border-l-purple-500",
      badgeVariant: "purple",
    },
    EMERGENCY: {
      icon: "🚨",
      border: "border-l-rose-500",
      badgeVariant: "danger",
    },
  };

  const sortedNotices = [...notices].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        Loading notices...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notices</h1>
        <p className="text-sm text-gray-500 mt-1">
          Announcements from your landlord
        </p>
      </div>

      {sortedNotices.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-8 h-8 text-gray-400" />}
          title="No notices"
          description="You'll see announcements from your landlord here."
        />
      ) : (
        <div className="space-y-3">
          {sortedNotices.map((n) => {
            const config = typeConfig[n.type] || typeConfig.GENERAL;
            const isRead = n.reads?.some((r: any) => r.tenantId === user.id);
            const typeLower = n.type.toLowerCase().replace("_", " ");
            return (
              <Card
                key={n.id}
                className={`p-5 border-l-4 ${config.border} ${!isRead ? "bg-blue-50/50 ring-1 ring-blue-200" : ""} cursor-pointer hover:shadow-md transition-all`}
                onClick={() => markRead(n.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{config.icon}</span>
                      <h3 className="font-semibold text-gray-900">{n.title}</h3>
                      {!isRead && <Badge variant="info">New</Badge>}
                      <Badge variant={config.badgeVariant}>{typeLower}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 whitespace-pre-line mt-2">
                      {n.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-3">
                      {n.createdAt?.split("T")[0]}
                    </p>
                  </div>
                  {isRead && (
                    <CheckCheck className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-1" />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
