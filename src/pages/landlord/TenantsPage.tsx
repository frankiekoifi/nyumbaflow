import { useState, useCallback, useEffect } from "react";
import {
  Card,
  Button,
  Input,
  Modal,
  Badge,
  EmptyState,
} from "../../components/ui";
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  Home,
  Phone,
  Mail,
  Users,
} from "lucide-react";
import {
  tenantsAPI,
  housesAPI,
  authAPI,
  paymentsAPI,
} from "../../services/api";

export default function TenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [houses, setHouses] = useState<any[]>([]);
  const [lastPayments, setLastPayments] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editTenant, setEditTenant] = useState<any | null>(null);
  const [showAssign, setShowAssign] = useState<any | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [tenantsRes, housesRes, paymentsRes] = await Promise.all([
        tenantsAPI.getAll(),
        housesAPI.getAll(),
        paymentsAPI.getAll(),
      ]);
      setTenants(tenantsRes.data);
      setHouses(housesRes.data);

      // Map the latest payment for each tenant
      const paymentsMap: { [key: string]: any } = {};
      paymentsRes.data.forEach((payment: any) => {
        const tenantId = payment.tenantId;
        const currentLatest = paymentsMap[tenantId];
        // If no payment recorded yet, or this payment is more recent
        if (
          !currentLatest ||
          new Date(payment.date) > new Date(currentLatest.date)
        ) {
          paymentsMap[tenantId] = payment;
        }
      });
      setLastPayments(paymentsMap);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase()),
  );

  const getTenantHouse = (tenantId: string) => {
    return houses.find((h) => h.tenantId === tenantId);
  };

  const handleAdd = async () => {
    if (!form.name || !form.email || !form.phone || !form.password) return;
    try {
      await authAPI.register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      setForm({ name: "", email: "", phone: "", password: "" });
      setShowAdd(false);
      await fetchData();
    } catch (error) {
      console.error("Failed to add tenant:", error);
    }
  };

  const handleEdit = async () => {
    if (!editTenant) return;
    try {
      await tenantsAPI.update(editTenant.id, {
        name: form.name,
        email: form.email,
        phone: form.phone,
      });
      setEditTenant(null);
      await fetchData();
    } catch (error) {
      console.error("Failed to update tenant:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to remove this tenant?")) {
      try {
        await tenantsAPI.delete(id);
        await fetchData();
      } catch (error) {
        console.error("Failed to delete tenant:", error);
      }
    }
  };

  const handleAssign = async (houseId: string) => {
    if (!showAssign) return;
    try {
      console.log("Assigning tenant:", showAssign.id, "to house:", houseId);

      const response = await housesAPI.update(houseId, {
        tenantId: showAssign.id,
        status: "OCCUPIED",
      });

      console.log("Assign response:", response.data);

      // Close the modal
      setShowAssign(null);

      // Refresh data with a small delay to ensure database is updated
      setTimeout(async () => {
        await fetchData();
        console.log("Data refreshed");
      }, 500);
    } catch (error) {
      console.error("Failed to assign tenant:", error);
    }
  };

  const vacantHouses = houses.filter((h) => h.status === "VACANT");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        Loading tenants...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-sm text-gray-500 mt-1">
            {tenants.length} tenants registered
          </p>
        </div>
        <Button
          onClick={() => {
            setForm({ name: "", email: "", phone: "", password: "" });
            setShowAdd(true);
          }}
        >
          <Plus className="w-4 h-4" /> Add Tenant
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          placeholder="Search tenants..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredTenants.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8 text-gray-400" />}
          title="No tenants found"
          description="Add your first tenant to get started."
          action={<Button onClick={() => setShowAdd(true)}>Add Tenant</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTenants.map((tenant) => {
            const house = getTenantHouse(tenant.id);
            const lastPayment = lastPayments[tenant.id];
            return (
              <Card
                key={tenant.id}
                className="p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-brand-500 to-brand-700 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {tenant.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {tenant.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        Since {tenant.createdAt?.split("T")[0]}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />{" "}
                    {tenant.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />{" "}
                    {tenant.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Home className="w-3.5 h-3.5 text-gray-400" />
                    {house ? (
                      <span>
                        {house.name} —{" "}
                        <span className="font-medium">
                          KES {house.rent.toLocaleString()}/mo
                        </span>
                      </span>
                    ) : (
                      <span className="text-amber-600">Not assigned</span>
                    )}
                  </div>
                </div>

                {lastPayment && (
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg mb-3">
                    <span className="text-xs text-gray-500">Last payment</span>
                    <Badge
                      variant={
                        lastPayment.status === "PAID"
                          ? "success"
                          : lastPayment.status === "PENDING"
                            ? "warning"
                            : "danger"
                      }
                    >
                      {lastPayment.status?.toLowerCase()} —{" "}
                      {lastPayment.date?.split("T")[0]}
                    </Badge>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setForm({
                        name: tenant.name,
                        email: tenant.email,
                        phone: tenant.phone,
                        password: "",
                      });
                      setEditTenant(tenant);
                    }}
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </Button>
                  {!house && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => setShowAssign(tenant)}
                    >
                      <Home className="w-3.5 h-3.5" /> Assign
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(tenant.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add New Tenant"
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Grace Wanjiku"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            placeholder="tenant@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Phone"
            placeholder="+254712345678"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Set a password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Button onClick={handleAdd} className="w-full">
            Add Tenant
          </Button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!editTenant}
        onClose={() => setEditTenant(null)}
        title="Edit Tenant"
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Button onClick={handleEdit} className="w-full">
            Save Changes
          </Button>
        </div>
      </Modal>

      {/* Assign Modal */}
      <Modal
        open={!!showAssign}
        onClose={() => setShowAssign(null)}
        title={`Assign ${showAssign?.name} to a Unit`}
      >
        {vacantHouses.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No vacant units available.
          </p>
        ) : (
          <div className="space-y-3">
            {vacantHouses.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleAssign(h.id)}
              >
                <div>
                  <p className="font-medium text-gray-900">{h.name}</p>
                  <p className="text-xs text-gray-500">{h.address}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    KES {h.rent.toLocaleString()}/mo
                  </p>
                  <Badge variant="success">{h.type.toLowerCase()}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
