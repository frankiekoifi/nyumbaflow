import { useState } from "react";
import { authAPI } from "../services/api";
import { User } from "../types";
import { Button, Input } from "../components/ui";
import { Building2, Eye, EyeOff, LogIn, UserPlus } from "lucide-react";

export default function AuthPage({
  onLogin,
}: {
  onLogin: (user: User) => void;
}) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const response = await authAPI.login({ email, password });
        const { token, user } = response.data;

        // Normalize role to lowercase for frontend consistency
        if (user.role) {
          user.role = user.role.toLowerCase();
        }

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        onLogin(user);
      } else {
        const response = await authAPI.register({
          name,
          email,
          password,
          phone,
        });
        const { token, user } = response.data;

        // Normalize role to lowercase
        if (user.role) {
          user.role = user.role.toLowerCase();
        }

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        onLogin(user);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-brand-300 rounded-full blur-3xl" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">NyumbaFlow</span>
          </div>
        </div>
        <div className="relative space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Smart Tenant
            <br />
            Management System
          </h1>
          <p className="text-lg text-blue-100 max-w-md">
            Manage your properties, track payments, handle maintenance requests,
            and keep tenants happy — all in one place.
          </p>
          <div className="flex gap-8 pt-4">
            <div>
              <p className="text-3xl font-bold text-white">500+</p>
              <p className="text-sm text-blue-200">Properties</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">2K+</p>
              <p className="text-sm text-blue-200">Tenants</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">98%</p>
              <p className="text-sm text-blue-200">Satisfaction</p>
            </div>
          </div>
        </div>
        <div className="relative">
          <p className="text-sm text-blue-200">
            © 2025 NyumbaFlow. Built for Kenya 🇰🇪
          </p>
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="p-2.5 bg-brand-600 rounded-xl">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">NyumbaFlow</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                {isLogin ? "Welcome back" : "Create account"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {isLogin
                  ? "Sign in to your account"
                  : "Get started with NyumbaFlow"}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700 animate-fadeIn">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <Input
                    label="Full Name"
                    placeholder="e.g. Grace Wanjiku"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <Input
                    label="Phone Number"
                    placeholder="+254712345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </>
              )}
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isLogin ? (
                  <>
                    <LogIn className="w-4 h-4" /> Sign In
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" /> Create Account
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                }}
                className="text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>

            {/* Demo credentials */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center mb-3">
                Quick demo access
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setEmail("admin@nyumbaflow.com");
                    setPassword("admin123");
                    setIsLogin(true);
                  }}
                  className="px-3 py-2 text-xs font-medium bg-brand-50 text-brand-700 rounded-lg hover:bg-brand-100 transition-colors"
                >
                  🏠 Landlord Demo
                </button>
                <button
                  onClick={() => {
                    setEmail("wanjiku@gmail.com");
                    setPassword("tenant123");
                    setIsLogin(true);
                  }}
                  className="px-3 py-2 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  👤 Tenant Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
