import { useState, useEffect } from "react";
import { User } from "../../types";
import { Card, Button, Input } from "../../components/ui";
import { User as UserIcon, Save, Check } from "lucide-react";
import { tenantsAPI, housesAPI } from "../../services/api";

export default function TenantProfile({
  user,
  onUpdate,
}: {
  user: User;
  onUpdate: (user: User) => void;
}) {
  const [house, setHouse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
  });

  useEffect(() => {
    fetchHouse();
  }, [user.id]);

  const fetchHouse = async () => {
    try {
      setLoading(true);
      const housesRes = await housesAPI.getAll();
      const userHouse = housesRes.data.find((h: any) => h.tenantId === user.id);
      setHouse(userHouse || null);
    } catch (error) {
      console.error("Failed to fetch house:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await tenantsAPI.update(user.id, {
        name: form.name,
        email: form.email,
        phone: form.phone,
      });

      // Update the local user object
      const updatedUser = { ...user, ...form };
      onUpdate(updatedUser);

      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          View and update your personal information
        </p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 animate-fadeIn">
          <Check className="w-4 h-4" /> Profile updated successfully!
        </div>
      )}

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center">
            <span className="text-2xl font-bold text-white">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-sm text-gray-500">
              Tenant since {user.createdAt?.split("T")[0]}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            label="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            disabled={!editing}
          />
          <Input
            label="Email Address"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            disabled={!editing}
          />
          <Input
            label="Phone Number"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            disabled={!editing}
          />

          {house && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned Unit
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                {house.name} — {house.address} (KES{" "}
                {house.rent.toLocaleString()}/mo)
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {editing ? (
              <>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4" /> Save Changes
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditing(false);
                    setForm({
                      name: user.name,
                      email: user.email,
                      phone: user.phone,
                    });
                  }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditing(true)}>
                <UserIcon className="w-4 h-4" /> Edit Profile
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
