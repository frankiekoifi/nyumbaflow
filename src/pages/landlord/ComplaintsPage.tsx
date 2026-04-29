import { useState, useCallback, useEffect } from "react";
import { Card, Badge, Button, Tabs, EmptyState } from "../../components/ui";
import { AlertTriangle, CheckCircle, Clock, Search } from "lucide-react";
import { complaintsAPI } from "../../services/api";

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      const response = await complaintsAPI.getAll();
      setComplaints(response.data);
    } catch (error) {
      console.error("Failed to fetch complaints:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const updateStatus = async (id: string, status: string) => {
    try {
      let apiStatus = "";
      if (status === "in-progress") apiStatus = "IN_PROGRESS";
      else if (status === "resolved") apiStatus = "RESOLVED";
      else apiStatus = "OPEN";

      await complaintsAPI.updateStatus(id, apiStatus);
      await fetchComplaints(); // Refresh the list
    } catch (error) {
      console.error("Failed to update complaint status:", error);
    }
  };

  const filteredComplaints = complaints
    .filter((c) => {
      const matchSearch =
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.tenant?.name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "all" || c.status.toLowerCase() === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const priorityColors: Record<string, string> = {
    URGENT: "bg-rose-500",
    HIGH: "bg-amber-500",
    MEDIUM: "bg-blue-500",
    LOW: "bg-gray-400",
  };

  const categoryIcons: Record<string, string> = {
    PLUMBING: "🔧",
    ELECTRICAL: "⚡",
    STRUCTURAL: "🏗️",
    PEST: "🐛",
    SECURITY: "🔒",
    OTHER: "📋",
  };

  const getStatusCount = (status: string) => {
    if (status === "all") return complaints.length;
    return complaints.filter((c) => c.status.toLowerCase() === status).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        Loading complaints...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Complaints & Issues
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage tenant-reported issues
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            placeholder="Search complaints..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Tabs
          tabs={[
            { id: "all", label: "All", count: getStatusCount("all") },
            { id: "open", label: "Open", count: getStatusCount("open") },
            {
              id: "in-progress",
              label: "In Progress",
              count: getStatusCount("in-progress"),
            },
            {
              id: "resolved",
              label: "Resolved",
              count: getStatusCount("resolved"),
            },
          ]}
          active={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      {filteredComplaints.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle className="w-8 h-8 text-gray-400" />}
          title="No complaints found"
          description="All caught up! No issues to display."
        />
      ) : (
        <div className="space-y-3">
          {filteredComplaints.map((c) => {
            const statusLower = c.status.toLowerCase();
            const priorityLower = c.priority.toLowerCase();
            return (
              <Card
                key={c.id}
                className="p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={`w-3 h-3 mt-1.5 rounded-full flex-shrink-0 ${priorityColors[c.priority]}`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">
                          {c.title}
                        </h3>
                        <span className="text-lg">
                          {categoryIcons[c.category]}
                        </span>
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
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {c.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>👤 {c.tenant?.name}</span>
                        <span>🏠 {c.house?.name}</span>
                        <span>📅 {c.createdAt?.split("T")[0]}</span>
                        {c.resolvedAt && (
                          <span>✅ Resolved {c.resolvedAt?.split("T")[0]}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusLower !== "resolved" && (
                      <>
                        {statusLower === "open" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(c.id, "in-progress")}
                          >
                            <Clock className="w-3.5 h-3.5" /> Start
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => updateStatus(c.id, "resolved")}
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Resolve
                        </Button>
                      </>
                    )}
                    <Badge
                      variant={
                        statusLower === "open"
                          ? "warning"
                          : statusLower === "in-progress"
                            ? "info"
                            : "success"
                      }
                    >
                      {statusLower}
                    </Badge>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
