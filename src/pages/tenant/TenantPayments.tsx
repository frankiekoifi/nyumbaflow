import { useState, useEffect } from "react";
import { User } from "../../types";
import { Card, Badge, Button, EmptyState, Tabs } from "../../components/ui";
import { DollarSign, Download, Receipt } from "lucide-react";
import { paymentsAPI, housesAPI } from "../../services/api";
import { generateReceiptPDF } from "../../services/pdf.service";

export default function TenantPayments({ user }: { user: User }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [house, setHouse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, housesRes] = await Promise.all([
        paymentsAPI.getByTenant(user.id),
        housesAPI.getAll(),
      ]);

      setPayments(paymentsRes.data);

      // Find the house assigned to this tenant
      const userHouse = housesRes.data.find((h: any) => h.tenantId === user.id);
      setHouse(userHouse || null);
    } catch (error) {
      console.error("Failed to fetch payment data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments
    .filter((p) => filter === "all" || p.status.toLowerCase() === filter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalPaid = payments
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + p.amount, 0);

  const pending = payments
    .filter((p) => p.status !== "PAID")
    .reduce((s, p) => s + p.amount, 0);

  const downloadReceipt = async (payment: any) => {
    await generateReceiptPDF({
      receiptNo: payment.receiptNo,
      date:
        payment.date?.split("T")[0] || new Date().toISOString().split("T")[0],
      tenantName: user.name,
      tenantId: user.id,
      houseName: house?.name || "N/A",
      houseAddress: house?.address || "N/A",
      houseId: house?.id || "N/A",
      amount: payment.amount,
      method: payment.method,
      month: payment.month?.slice(0, 7) || "",
      status: payment.status.toLowerCase(),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        Loading payments...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Payments</h1>
        <p className="text-sm text-gray-500 mt-1">
          View your payment history and download receipts
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-brand-500">
          <p className="text-sm text-gray-500">Monthly Rent</p>
          <p className="text-xl font-bold text-brand-700">
            KES {house?.rent?.toLocaleString() || "0"}
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <p className="text-sm text-gray-500">Total Paid</p>
          <p className="text-xl font-bold text-emerald-700">
            KES {totalPaid.toLocaleString()}
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-500">
          <p className="text-sm text-gray-500">Outstanding</p>
          <p className="text-xl font-bold text-amber-700">
            KES {pending.toLocaleString()}
          </p>
        </Card>
      </div>

      <Tabs
        tabs={[
          { id: "all", label: "All", count: payments.length },
          { id: "paid", label: "Paid" },
          { id: "pending", label: "Pending" },
          { id: "overdue", label: "Overdue" },
        ]}
        active={filter}
        onChange={setFilter}
      />

      {filteredPayments.length === 0 ? (
        <EmptyState
          icon={<DollarSign className="w-8 h-8 text-gray-400" />}
          title="No payments"
          description="No payment records to show."
        />
      ) : (
        <div className="space-y-3">
          {filteredPayments.map((p) => {
            const statusLower = p.status.toLowerCase();
            return (
              <Card
                key={p.id}
                className="p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-xl ${
                        p.status === "PAID"
                          ? "bg-emerald-50"
                          : p.status === "PENDING"
                            ? "bg-amber-50"
                            : "bg-rose-50"
                      }`}
                    >
                      <Receipt
                        className={`w-5 h-5 ${
                          p.status === "PAID"
                            ? "text-emerald-600"
                            : p.status === "PENDING"
                              ? "text-amber-600"
                              : "text-rose-600"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        KES {p.amount.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <span>{p.date?.split("T")[0]}</span>
                        <span>•</span>
                        <span>{p.method}</span>
                        <span>•</span>
                        <span className="font-mono">{p.receiptNo}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        p.status === "PAID"
                          ? "success"
                          : p.status === "PENDING"
                            ? "warning"
                            : "danger"
                      }
                    >
                      {statusLower}
                    </Badge>
                    {p.status === "PAID" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadReceipt(p)}
                      >
                        <Download className="w-3.5 h-3.5" /> Receipt
                      </Button>
                    )}
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
