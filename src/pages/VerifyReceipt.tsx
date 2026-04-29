import { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // Change from useSearchParams
import { Card, Badge } from "../components/ui";
import { CheckCircle, XCircle, Building2 } from "lucide-react";
import { paymentsAPI, housesAPI, tenantsAPI } from "../services/api";

export default function VerifyReceipt() {
  const { receiptNo } = useParams(); // Get from URL path instead of query
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [payment, setPayment] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (receiptNo) {
      verifyReceipt();
    } else {
      setError("Invalid receipt number");
      setVerifying(false);
    }
  }, [receiptNo]);

  const verifyReceipt = async () => {
    try {
      // Fetch all payments and find matching receipt
      const paymentsRes = await paymentsAPI.getAll();
      const foundPayment = paymentsRes.data.find(
        (p: any) => p.receiptNo === receiptNo,
      );

      if (!foundPayment) {
        setError("Receipt not found in our records");
        setVerified(false);
        return;
      }

      // Fetch tenant and house details
      const [tenantRes, houseRes] = await Promise.all([
        tenantsAPI.getOne(foundPayment.tenantId),
        housesAPI.getOne(foundPayment.houseId),
      ]);

      setPayment({
        ...foundPayment,
        tenant: tenantRes.data,
        house: houseRes.data,
      });
      setVerified(true);
    } catch (err) {
      console.error("Verification failed:", err);
      setError("Unable to verify receipt. Please try again later.");
      setVerified(false);
    } finally {
      setVerifying(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying receipt...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">NyumbaFlow</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Receipt Verification
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Verify the authenticity of this payment receipt
          </p>
        </div>

        {/* Verification Result */}
        <Card className="p-6 mb-6">
          <div className="text-center mb-6">
            {verified ? (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  ✓ Receipt Verified
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  This receipt is authentic and valid
                </p>
              </>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-100 rounded-full mb-4">
                  <XCircle className="w-8 h-8 text-rose-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  ✗ Verification Failed
                </h2>
                <p className="text-sm text-gray-500 mt-1">{error}</p>
              </>
            )}
          </div>

          {verified && payment && (
            <>
              <div className="border-t border-gray-100 pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Receipt Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Receipt Number:</span>
                    <span className="font-mono font-medium">
                      {payment.receiptNo}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Payment Date:</span>
                    <span>{payment.date?.split("T")[0]}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Amount:</span>
                    <span className="font-bold text-gray-900">
                      KES {payment.amount?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Payment Method:</span>
                    <Badge variant="success">{payment.method}</Badge>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Status:</span>
                    <Badge variant="success">
                      {payment.status?.toLowerCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 mt-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Tenant Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Name:</span>
                    <span>{payment.tenant?.name}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Email:</span>
                    <span>{payment.tenant?.email}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 mt-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Property Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Unit:</span>
                    <span>{payment.house?.name}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Address:</span>
                    <span>{payment.house?.address}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400">
          <p>
            This verification confirms that this receipt was issued by
            NyumbaFlow system.
          </p>
          <p className="mt-1">
            For any questions, please contact support@nyumbaflow.com
          </p>
        </div>
      </div>
    </div>
  );
}
