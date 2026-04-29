import { useState, useCallback, useEffect } from "react";
import {
  Card,
  Button,
  Input,
  Textarea,
  Select,
  Modal,
  Badge,
  EmptyState,
} from "../../components/ui";
import { Bell, Send, Users, Megaphone } from "lucide-react";
import { noticesAPI, tenantsAPI } from "../../services/api";

export default function NoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [totalTenants, setTotalTenants] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", type: "GENERAL" });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [noticesRes, tenantsRes] = await Promise.all([
        noticesAPI.getAll(),
        tenantsAPI.getAll(),
      ]);
      setNotices(noticesRes.data);
      setTotalTenants(tenantsRes.data.length);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSend = async () => {
    if (!form.title || !form.message) return;
    try {
      await noticesAPI.create({
        title: form.title,
        message: form.message,
        type: form.type,
        targetAll: true,
      });
      setForm({ title: "", message: "", type: "GENERAL" });
      setShowAdd(false);
      await fetchData();
    } catch (error) {
      console.error("Failed to send notice:", error);
    }
  };

  const typeConfig: Record<
    string,
    {
      icon: string;
      color: string;
      variant: "info" | "warning" | "danger" | "default" | "purple" | "success";
    }
  > = {
    GENERAL: { icon: "📢", color: "border-l-blue-500", variant: "info" },
    RENT_REMINDER: {
      icon: "💰",
      color: "border-l-amber-500",
      variant: "warning",
    },
    MAINTENANCE: {
      icon: "🔧",
      color: "border-l-purple-500",
      variant: "purple",
    },
    EMERGENCY: { icon: "🚨", color: "border-l-rose-500", variant: "danger" },
  };

  const getReadCount = (notice: any) => {
    return notice.reads?.length || 0;
  };

  const getReadPercentage = (notice: any) => {
    if (totalTenants === 0) return 0;
    return Math.round((getReadCount(notice) / totalTenants) * 100);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Notices & Announcements
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Send announcements to your tenants
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Megaphone className="w-4 h-4" /> New Announcement
        </Button>
      </div>

      {sortedNotices.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-8 h-8 text-gray-400" />}
          title="No notices yet"
          description="Send your first announcement to tenants."
          action={
            <Button onClick={() => setShowAdd(true)}>Send Announcement</Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {sortedNotices.map((n) => {
            const config = typeConfig[n.type] || typeConfig.GENERAL;
            const readCount = getReadCount(n);
            const readPercentage = getReadPercentage(n);
            return (
              <Card
                key={n.id}
                className={`p-5 border-l-4 ${config.color} hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{config.icon}</span>
                      <h3 className="font-semibold text-gray-900">{n.title}</h3>
                      <Badge variant={config.variant}>
                        {n.type.toLowerCase().replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span>📅 {n.createdAt?.split("T")[0]}</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        All tenants
                      </span>
                      <span>
                        👁️ {readCount}/{totalTenants} read
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {readPercentage}%
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="New Announcement"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            placeholder="e.g. Rent Reminder"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Select
            label="Type"
            options={[
              { value: "GENERAL", label: "📢 General" },
              { value: "RENT_REMINDER", label: "💰 Rent Reminder" },
              { value: "MAINTENANCE", label: "🔧 Maintenance" },
              { value: "EMERGENCY", label: "🚨 Emergency" },
            ]}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          />
          <Textarea
            label="Message"
            placeholder="Write your announcement..."
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
          <Button onClick={handleSend} className="w-full">
            <Send className="w-4 h-4" /> Send to All Tenants
          </Button>
        </div>
      </Modal>
    </div>
  );
}
