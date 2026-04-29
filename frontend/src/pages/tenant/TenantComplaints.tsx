import { useState, useCallback, useEffect } from "react";
import { User } from "../../types";
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
import { Plus, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { complaintsAPI, housesAPI } from "../../services/api";

export default function TenantComplaints({ user }: { user: User }) {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [house, setHouse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "PLUMBING",
    priority: "MEDIUM",
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [complaintsRes, housesRes] = await Promise.all([
        complaintsAPI.getByTenant(user.id),
        housesAPI.getAll(),
      ]);

      setComplaints(complaintsRes.data);

      // Find the house assigned to this tenant
      const userHouse = housesRes.data.find((h: any) => h.tenantId === user.id);
      setHouse(userHouse || null);
    } catch (error) {
      console.error("Failed to fetch complaints:", error);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async () => {
    if (!form.title || !form.description || !house) return;
    try {
      await complaintsAPI.create({
        tenantId: user.id,
        houseId: house.id,
        title: form.title,
        description: form.description,
        category: form.category,
        priority: form.priority,
      });
      setForm({
        title: "",
        description: "",
        category: "PLUMBING",
        priority: "MEDIUM",
      });
      setShowAdd(false);
      await fetchData();
    } catch (error) {
      console.error("Failed to submit complaint:", error);
    }
  };

  const statusIcons: Record<string, typeof CheckCircle> = {
    OPEN: Clock,
    IN_PROGRESS: AlertTriangle,
    RESOLVED: CheckCircle,
  };

  const categoryIcons: Record<string, string> = {
    PLUMBING: "🔧",
    ELECTRICAL: "⚡",
    STRUCTURAL: "🏗️",
    PEST: "🐛",
    SECURITY: "🔒",
    OTHER: "📋",
  };

  const sortedComplaints = [...complaints].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        Loading complaints...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Maintenance & Complaints
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Report issues and track their resolution
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)} disabled={!house}>
          <Plus className="w-4 h-4" /> Report Issue
        </Button>
      </div>

      {!house && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <p className="text-sm text-amber-700">
            You need to be assigned to a unit before reporting issues.
          </p>
        </Card>
      )}

      {sortedComplaints.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle className="w-8 h-8 text-gray-400" />}
          title="No complaints"
          description="You haven't reported any issues yet."
          action={
            house ? (
              <Button onClick={() => setShowAdd(true)}>Report Issue</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {sortedComplaints.map((c) => {
            const StatusIcon = statusIcons[c.status] || Clock;
            const statusLower = c.status.toLowerCase();
            const priorityLower = c.priority.toLowerCase();
            return (
              <Card
                key={c.id}
                className="p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-2.5 rounded-xl ${
                      c.status === "RESOLVED"
                        ? "bg-emerald-50"
                        : c.status === "IN_PROGRESS"
                          ? "bg-blue-50"
                          : "bg-amber-50"
                    }`}
                  >
                    <StatusIcon
                      className={`w-5 h-5 ${
                        c.status === "RESOLVED"
                          ? "text-emerald-600"
                          : c.status === "IN_PROGRESS"
                            ? "text-blue-600"
                            : "text-amber-600"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-lg">
                        {categoryIcons[c.category]}
                      </span>
                      <h3 className="font-semibold text-gray-900">{c.title}</h3>
                      <Badge
                        variant={
                          c.priority === "URGENT"
                            ? "danger"
                            : c.priority === "HIGH"
                              ? "warning"
                              : c.priority === "MEDIUM"
                                ? "info"
                                : "default"
                        }
                      >
                        {priorityLower}
                      </Badge>
                      <Badge
                        variant={
                          c.status === "RESOLVED"
                            ? "success"
                            : c.status === "IN_PROGRESS"
                              ? "info"
                              : "warning"
                        }
                      >
                        {statusLower}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {c.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>📅 Reported: {c.createdAt?.split("T")[0]}</span>
                      {c.resolvedAt && (
                        <span>✅ Resolved: {c.resolvedAt?.split("T")[0]}</span>
                      )}
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
        title="Report an Issue"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            placeholder="e.g. Leaking tap in kitchen"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              options={[
                { value: "PLUMBING", label: "🔧 Plumbing" },
                { value: "ELECTRICAL", label: "⚡ Electrical" },
                { value: "STRUCTURAL", label: "🏗️ Structural" },
                { value: "PEST", label: "🐛 Pest Control" },
                { value: "SECURITY", label: "🔒 Security" },
                { value: "OTHER", label: "📋 Other" },
              ]}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
            <Select
              label="Priority"
              options={[
                { value: "LOW", label: "Low" },
                { value: "MEDIUM", label: "Medium" },
                { value: "HIGH", label: "High" },
                { value: "URGENT", label: "Urgent" },
              ]}
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            />
          </div>
          <Textarea
            label="Description"
            placeholder="Describe the issue in detail..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Button onClick={handleSubmit} className="w-full">
            Submit Report
          </Button>
        </div>
      </Modal>
    </div>
  );
}
