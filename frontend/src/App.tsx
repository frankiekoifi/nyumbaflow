import { useState, useCallback, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { User } from "../src/types";
import AuthPage from "./pages/AuthPage";
import VerifyReceipt from "./pages/VerifyReceipt";
import Dashboard from "./pages/landlord/Dashboard";
import TenantsPage from "./pages/landlord/TenantsPage";
import HousesPage from "./pages/landlord/HousesPage";
import PaymentsPage from "./pages/landlord/PaymentsPage";
import ComplaintsPage from "./pages/landlord/ComplaintsPage";
import NoticesPage from "./pages/landlord/NoticesPage";
import ReportsPage from "./pages/landlord/ReportsPage";
import TenantDashboard from "./pages/tenant/TenantDashboard";
import TenantPayments from "./pages/tenant/TenantPayments";
import TenantComplaints from "./pages/tenant/TenantComplaints";
import TenantNotices from "./pages/tenant/TenantNotices";
import TenantProfile from "./pages/tenant/TenantProfile";
import { noticesAPI, complaintsAPI } from "./services/api";
import {
  Building2,
  LayoutDashboard,
  Users,
  Home,
  DollarSign,
  AlertTriangle,
  Bell,
  BarChart3,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  Receipt,
  Wrench,
  ChevronRight,
} from "lucide-react";

type LandlordPage =
  | "dashboard"
  | "tenants"
  | "houses"
  | "payments"
  | "complaints"
  | "notices"
  | "reports";
type TenantPage =
  | "dashboard"
  | "payments"
  | "complaints"
  | "notices"
  | "profile";

const landlordNav: {
  id: LandlordPage;
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "tenants", label: "Tenants", icon: Users },
  { id: "houses", label: "Properties", icon: Home },
  { id: "payments", label: "Payments", icon: DollarSign },
  { id: "complaints", label: "Complaints", icon: AlertTriangle },
  { id: "notices", label: "Notices", icon: Bell },
  { id: "reports", label: "Reports", icon: BarChart3 },
];

const tenantNav: {
  id: TenantPage;
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "payments", label: "Payments", icon: Receipt },
  { id: "complaints", label: "Issues", icon: Wrench },
  { id: "notices", label: "Notices", icon: Bell },
  { id: "profile", label: "Profile", icon: UserIcon },
];

export default function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [page, setPage] = useState<string>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [, setTick] = useState(0);
  const [unreadNotices, setUnreadNotices] = useState(0);
  const [openComplaints, setOpenComplaints] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!user) return;

    const fetchCounts = async () => {
      try {
        if (user.role === "tenant") {
          const noticesRes = await noticesAPI.getByTenant(user.id);
          const unread = noticesRes.data.filter(
            (n: any) => !n.reads?.some((r: any) => r.tenantId === user.id),
          ).length;
          setUnreadNotices(unread);
        } else if (user.role === "landlord") {
          const complaintsRes = await complaintsAPI.getAll();
          const open = complaintsRes.data.filter(
            (c: any) => c.status !== "RESOLVED",
          ).length;
          setOpenComplaints(open);
        }
      } catch (error) {
        console.error("Failed to fetch counts:", error);
      }
    };

    fetchCounts();
  }, [user, refresh]);

  const handleLogin = (u: User) => {
    setUser(u);
    setPage("dashboard");
    localStorage.setItem("user", JSON.stringify(u));
    navigate("/");
  };

  const handleLogout = () => {
    setUser(null);
    setPage("dashboard");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const renderPage = () => {
    if (!user) return null;

    const isLandlord = user.role === "landlord";

    if (isLandlord) {
      switch (page as LandlordPage) {
        case "dashboard":
          return <Dashboard />;
        case "tenants":
          return <TenantsPage />;
        case "houses":
          return <HousesPage />;
        case "payments":
          return <PaymentsPage />;
        case "complaints":
          return <ComplaintsPage />;
        case "notices":
          return <NoticesPage />;
        case "reports":
          return <ReportsPage />;
        default:
          return <Dashboard />;
      }
    } else {
      switch (page as TenantPage) {
        case "dashboard":
          return <TenantDashboard user={user} />;
        case "payments":
          return <TenantPayments user={user} />;
        case "complaints":
          return <TenantComplaints user={user} />;
        case "notices":
          return <TenantNotices user={user} />;
        case "profile":
          return (
            <TenantProfile
              user={user}
              onUpdate={(u) => {
                setUser(u);
                localStorage.setItem("user", JSON.stringify(u));
                refresh();
              }}
            />
          );
        default:
          return <TenantDashboard user={user} />;
      }
    }
  };

  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  const isLandlord = user.role === "landlord";
  const nav = isLandlord ? landlordNav : tenantNav;
  const displayUnreadNotices = isLandlord ? 0 : unreadNotices;
  const displayOpenComplaints = isLandlord ? openComplaints : 0;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">NyumbaFlow</h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                {isLandlord ? "Admin Panel" : "Tenant Portal"}
              </p>
            </div>
          </div>
          <button
            className="lg:hidden p-1"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-1">
            {nav.map((item) => {
              const isActive = page === item.id;
              const Icon = item.icon;
              const showBadge =
                (item.id === "notices" && displayUnreadNotices > 0) ||
                (item.id === "complaints" && displayOpenComplaints > 0);
              const badgeCount =
                item.id === "notices"
                  ? displayUnreadNotices
                  : displayOpenComplaints;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setPage(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-brand-50 text-brand-700 shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? "text-brand-600" : "text-gray-400"}`}
                  />
                  <span className="flex-1 text-left">{item.label}</span>
                  {showBadge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white min-w-[18px] text-center">
                      {badgeCount}
                    </span>
                  )}
                  {isActive && (
                    <ChevronRight className="w-4 h-4 text-brand-400" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* User info & logout */}
        <div className="px-3 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-white">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-lg font-semibold text-gray-900 capitalize">
                {page}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <div
                className={`w-2 h-2 rounded-full ${isLandlord ? "bg-brand-500" : "bg-emerald-500"}`}
              />
              <span className="text-xs font-medium text-gray-600">
                {isLandlord ? "Landlord" : "Tenant"}
              </span>
            </div>
          </div>
        </header>

        {/* Page content with Routes */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Routes>
            <Route path="/" element={renderPage()} />
            <Route
              path="/verify-receipt/:receiptNo"
              element={<VerifyReceipt />}
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}
