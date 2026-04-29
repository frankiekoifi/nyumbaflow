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
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  Home,
  MapPin,
  UserMinus,
} from "lucide-react";
import { housesAPI } from "../../services/api";

const houseTypes = [
  { value: "APARTMENT", label: "Apartment" },
  { value: "BEDSITTER", label: "Bedsitter" },
  { value: "SINGLE", label: "Single Room" },
  { value: "DOUBLE", label: "Double Room" },
  { value: "STUDIO", label: "Studio" },
];

const defaultForm = {
  name: "",
  address: "",
  type: "APARTMENT",
  rent: "",
  description: "",
  amenities: "",
};

// Move FormContent outside the component
interface FormContentProps {
  form: typeof defaultForm;
  setForm: React.Dispatch<React.SetStateAction<typeof defaultForm>>;
  onSave: () => void;
  isEdit: boolean;
}

function FormContent({ form, setForm, onSave, isEdit }: FormContentProps) {
  return (
    <div className="space-y-4">
      <Input
        label="Unit Name"
        placeholder="e.g. Unit A1"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <Input
        label="Address"
        placeholder="e.g. Sunset Apartments, Kilimani"
        value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Type"
          options={houseTypes}
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        />
        <Input
          label="Rent (KES)"
          type="number"
          placeholder="25000"
          value={form.rent}
          onChange={(e) => setForm({ ...form, rent: e.target.value })}
        />
      </div>
      <Textarea
        label="Description"
        placeholder="Describe the unit..."
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
      <Input
        label="Amenities (comma-separated)"
        placeholder="WiFi, Parking, Security"
        value={form.amenities}
        onChange={(e) => setForm({ ...form, amenities: e.target.value })}
      />
      <Button onClick={onSave} className="w-full">
        {isEdit ? "Save Changes" : "Add Unit"}
      </Button>
    </div>
  );
}

export default function HousesPage() {
  const [houses, setHouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "occupied" | "vacant">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editHouse, setEditHouse] = useState<any | null>(null);
  const [form, setForm] = useState(defaultForm);

  const fetchHouses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await housesAPI.getAll();
      setHouses(response.data);
    } catch (error) {
      console.error("Failed to fetch houses:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHouses();
  }, [fetchHouses]);

  const filteredHouses = houses.filter((h) => {
    const matchesSearch =
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.address.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || h.status.toLowerCase() === filter;
    return matchesSearch && matchesFilter;
  });

  const handleSave = async (isEdit: boolean) => {
    try {
      const data = {
        name: form.name,
        address: form.address,
        type: form.type,
        rent: Number(form.rent),
        description: form.description,
        amenities: form.amenities
          .split(",")
          .map((a: string) => a.trim())
          .filter(Boolean),
      };

      if (isEdit && editHouse) {
        await housesAPI.update(editHouse.id, data);
        setEditHouse(null);
      } else {
        await housesAPI.create(data);
        setShowAdd(false);
      }
      setForm(defaultForm);
      await fetchHouses();
    } catch (error) {
      console.error("Failed to save house:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this unit?")) {
      try {
        await housesAPI.delete(id);
        await fetchHouses();
      } catch (error) {
        console.error("Failed to delete house:", error);
      }
    }
  };

  const handleUnassign = async (houseId: string) => {
    if (confirm("Remove tenant from this unit?")) {
      try {
        await housesAPI.update(houseId, { tenantId: null, status: "VACANT" });
        await fetchHouses();
      } catch (error) {
        console.error("Failed to unassign tenant:", error);
      }
    }
  };

  const getTypeColor = (type: string) => {
    const map: Record<string, string> = {
      APARTMENT: "bg-blue-100 text-blue-700",
      BEDSITTER: "bg-purple-100 text-purple-700",
      SINGLE: "bg-amber-100 text-amber-700",
      DOUBLE: "bg-emerald-100 text-emerald-700",
      STUDIO: "bg-rose-100 text-rose-700",
    };
    return map[type] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        Loading properties...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-sm text-gray-500 mt-1">
            {houses.length} units total
          </p>
        </div>
        <Button
          onClick={() => {
            setForm(defaultForm);
            setShowAdd(true);
          }}
        >
          <Plus className="w-4 h-4" /> Add Unit
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            placeholder="Search units..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(["all", "occupied", "vacant"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${
                filter === f
                  ? "bg-brand-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filteredHouses.length === 0 ? (
        <EmptyState
          icon={<Home className="w-8 h-8 text-gray-400" />}
          title="No units found"
          description="Add your first property unit."
          action={<Button onClick={() => setShowAdd(true)}>Add Unit</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHouses.map((house) => {
            const tenant = house.tenant;
            const statusLower = house.status.toLowerCase();
            return (
              <Card
                key={house.id}
                className="overflow-hidden hover:shadow-md transition-shadow"
              >
                <div
                  className={`h-2 ${statusLower === "occupied" ? "bg-emerald-500" : "bg-amber-400"}`}
                />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {house.name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(house.type)}`}
                        >
                          {house.type.toLowerCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <p className="text-xs text-gray-500">{house.address}</p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        statusLower === "occupied" ? "success" : "warning"
                      }
                    >
                      {statusLower}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">
                    {house.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {house.amenities?.map((a: string) => (
                      <span
                        key={a}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md"
                      >
                        {a}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between py-3 border-t border-gray-100">
                    <div>
                      <p className="text-xl font-bold text-gray-900">
                        KES {house.rent.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">per month</p>
                    </div>
                    {tenant && (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-brand-700">
                            {tenant.name?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-900">
                            {tenant.name}
                          </p>
                          <p className="text-xs text-gray-500">Tenant</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setForm({
                          name: house.name,
                          address: house.address,
                          type: house.type,
                          rent: house.rent.toString(),
                          description: house.description,
                          amenities: house.amenities?.join(", ") || "",
                        });
                        setEditHouse(house);
                      }}
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </Button>
                    {tenant && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUnassign(house.id)}
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(house.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    </Button>
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
        title="Add New Unit"
      >
        <FormContent
          form={form}
          setForm={setForm}
          onSave={() => handleSave(false)}
          isEdit={false}
        />
      </Modal>

      <Modal
        open={!!editHouse}
        onClose={() => setEditHouse(null)}
        title="Edit Unit"
      >
        <FormContent
          form={form}
          setForm={setForm}
          onSave={() => handleSave(true)}
          isEdit={true}
        />
      </Modal>
    </div>
  );
}
