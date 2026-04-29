import { useState, useCallback, useEffect } from "react";
import {
  Card,
  Button,
  Input,
  Select,
  Modal,
  Badge,
  Tabs,
} from "../../components/ui";
import { Plus, Search } from "lucide-react";
import { paymentsAPI, tenantsAPI } from "../../services/api";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    tenantId: "",
    amount: "",
    method: "MPESA",
    status: "PAID",
    month: new Date().toISOString().slice(0, 7),
    date: new Date().toISOString().split("T")[0],
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [paymentsRes, tenantsRes] = await Promise.all([
        paymentsAPI.getAll(),
        tenantsAPI.getAll(),
      ]);
      setPayments(paymentsRes.data);
      setTenants(tenantsRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredPayments = payments
    .filter((p) => {
      const tenant = tenants.find((t) => t.id === p.tenantId);
      const matchesSearch =
        tenant?.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.receiptNo?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || p.status.toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const tenantsWithHouses = tenants.filter((t) => t.house);

  const handleAdd = async () => {
    try {
      const tenant = tenants.find((t) => t.id === form.tenantId);
      const house = tenant?.house;
      if (!tenant || !house) return;

      await paymentsAPI.create({
        tenantId: form.tenantId,
        houseId: house.id,
        amount: Number(form.amount),
        method: form.method,
        status: form.status,
        month: form.month,
        date: form.date,
      });
      setShowAdd(false);
      setForm({
        tenantId: "",
        amount: "",
        method: "MPESA",
        status: "PAID",
        month: new Date().toISOString().slice(0, 7),
        date: new Date().toISOString().split("T")[0],
      });
      await fetchData();
    } catch (error) {
      console.error("Failed to add payment:", error);
    }
  };

  const toggleStatus = async (paymentId: string, currentStatus: string) => {
    let newStatus = "";
    if (currentStatus === "PAID") newStatus = "PENDING";
    else if (currentStatus === "PENDING") newStatus = "OVERDUE";
    else newStatus = "PAID";

    try {
      await paymentsAPI.updateStatus(paymentId, newStatus);
      await fetchData();
    } catch (error) {
      console.error("Failed to update payment status:", error);
    }
  };

  const totalCollected = payments
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + p.amount, 0);
  const totalPending = payments
    .filter((p) => p.status === "PENDING")
    .reduce((s, p) => s + p.amount, 0);
  const totalOverdue = payments
    .filter((p) => p.status === "OVERDUE")
    .reduce((s, p) => s + p.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        Loading payments...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track rent payments and arrears
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" /> Record Payment
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <p className="text-sm text-gray-500">Collected</p>
          <p className="text-xl font-bold text-emerald-700">
            KES {totalCollected.toLocaleString()}
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-500">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-xl font-bold text-amber-700">
            KES {totalPending.toLocaleString()}
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-l-rose-500">
          <p className="text-sm text-gray-500">Overdue</p>
          <p className="text-xl font-bold text-rose-700">
            KES {totalOverdue.toLocaleString()}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            placeholder="Search by tenant or receipt..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Tabs
          tabs={[
            { id: "all", label: "All" },
            { id: "paid", label: "Paid" },
            { id: "pending", label: "Pending" },
            { id: "overdue", label: "Overdue" },
          ]}
          active={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Unit
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Month
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Receipt
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((p) => {
                const tenant = tenants.find((t) => t.id === p.tenantId);
                const house = p.house;
                return (
                  <tr
                    key={p.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-brand-700">
                            {tenant?.name?.charAt(0)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {tenant?.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {house?.name}
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-gray-900">
                      KES {p.amount?.toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        variant={
                          p.method === "MPESA"
                            ? "success"
                            : p.method === "BANK"
                              ? "info"
                              : "default"
                        }
                      >
                        {p.method}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {p.month?.slice(0, 7)}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {p.date?.split("T")[0]}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500 font-mono">
                      {p.receiptNo}
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => toggleStatus(p.id, p.status)}>
                        <Badge
                          variant={
                            p.status === "PAID"
                              ? "success"
                              : p.status === "PENDING"
                                ? "warning"
                                : "danger"
                          }
                        >
                          {p.status.toLowerCase()}
                        </Badge>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredPayments.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-500">
              No payments found.
            </div>
          )}
        </div>
      </Card>

      {/* Add Modal */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Record Payment"
      >
        <div className="space-y-4">
          <Select
            label="Tenant"
            options={[
              { value: "", label: "Select tenant..." },
              ...tenantsWithHouses.map((t) => ({
                value: t.id,
                label: `${t.name} — ${t.house?.name || ""}`,
              })),
            ]}
            value={form.tenantId}
            onChange={async (e) => {
              const tenant = tenants.find((t) => t.id === e.target.value);
              const house = tenant?.house;
              setForm({
                ...form,
                tenantId: e.target.value,
                amount: house ? house.rent.toString() : form.amount,
              });
            }}
          />
          <Input
            label="Amount (KES)"
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Method"
              options={[
                { value: "MPESA", label: "M-Pesa" },
                { value: "BANK", label: "Bank Transfer" },
                { value: "CASH", label: "Cash" },
              ]}
              value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value })}
            />
            <Select
              label="Status"
              options={[
                { value: "PAID", label: "Paid" },
                { value: "PENDING", label: "Pending" },
                { value: "OVERDUE", label: "Overdue" },
              ]}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Month"
              type="month"
              value={form.month}
              onChange={(e) => setForm({ ...form, month: e.target.value })}
            />
            <Input
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <Button onClick={handleAdd} className="w-full">
            Record Payment
          </Button>
        </div>
      </Modal>
    </div>
  );
}
