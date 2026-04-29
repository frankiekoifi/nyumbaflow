import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";

export interface ReceiptData {
  receiptNo: string;
  date: string;
  tenantName: string;
  tenantId: string;
  houseName: string;
  houseAddress: string;
  houseId: string;
  amount: number;
  method: string;
  month: string;
  status: string;
}

// Date formatter utility
const formatDate = (dateString: string): string => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-KE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Get secure verification URL (using path parameter instead of query params)
const getVerificationUrl = (receiptNo: string): string => {
  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  return `${baseUrl}/verify-receipt/${receiptNo}`;
};

// Generate QR Code as DataURL with optimal size
const generateQRCodeDataURL = async (text: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: "H",
      margin: 0,
      width: 80,
      color: {
        dark: "#1e3a8a",
        light: "#ffffff",
      },
    });
  } catch (error) {
    console.error("QR Code generation failed:", error);
    return "";
  }
};

// Add watermark to PDF
const addWatermark = (doc: jsPDF) => {
  doc.setFontSize(40);
  doc.setTextColor(200, 200, 200);
  doc.setFont("helvetica", "bold");

  const watermarkText = "PAID";
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Save current graphics state
  doc.saveGraphicsState();

  // Set opacity
  doc.setGState(new (doc as any).GState({ opacity: 0.15 }));

  // Draw rotated text
  doc.text(watermarkText, pageWidth / 2, pageHeight / 2, {
    align: "center",
    angle: 45,
  });

  // Restore graphics state
  doc.restoreGraphicsState();
};

// Safe access to lastAutoTable
const getLastAutoTableY = (
  doc: jsPDF & { lastAutoTable?: { finalY: number } },
): number => {
  return doc.lastAutoTable?.finalY || 200;
};

export const generateReceiptPDF = async (data: ReceiptData) => {
  const doc = new jsPDF() as jsPDF & { lastAutoTable?: { finalY: number } };

  // Generate verification URL and QR Code
  const verificationUrl = getVerificationUrl(data.receiptNo);
  const qrCodeDataURL = await generateQRCodeDataURL(verificationUrl);

  // ============ HEADER ============
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, 210, 45, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("NYUMBAFLOW", 105, 25, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Smart Property Management System", 105, 35, { align: "center" });

  // ============ RECEIPT TITLE ============
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT RECEIPT", 105, 60, { align: "center" });

  // ============ RECEIPT INFO ============
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Receipt No: ${data.receiptNo}`, 20, 75);
  doc.text(`Date: ${formatDate(data.date)}`, 150, 75);

  // ============ DIVIDER ============
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 82, 190, 82);

  // ============ TENANT DETAILS ============
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Tenant Details", 20, 95);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${data.tenantName}`, 20, 105);
  doc.text(`Tenant ID: ${data.tenantId.slice(0, 8)}...`, 20, 115);

  // ============ PROPERTY DETAILS ============
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Property Details", 20, 135);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Unit: ${data.houseName}`, 20, 145);

  // Handle long addresses with text splitting
  const addressLines = doc.splitTextToSize(data.houseAddress, 150);
  doc.text(addressLines, 20, 155);

  // ============ PAYMENT TABLE ============
  autoTable(doc, {
    startY: 175,
    head: [["Description", "Amount (KES)"]],
    body: [[`Rent Payment - ${data.month}`, `${data.amount.toLocaleString()}`]],
    foot: [["TOTAL", `${data.amount.toLocaleString()}`]],
    theme: "striped",
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    footStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 50, halign: "right" },
    },
  });

  const finalY = getLastAutoTableY(doc);

  // ============ PAYMENT DETAILS ============
  doc.setFontSize(10);
  doc.text(`Payment Method: ${data.method}`, 20, finalY + 10);
  doc.text(`Status: ${data.status.toUpperCase()}`, 20, finalY + 20);

  // ============ QR CODE SECTION - COMPACT ============
  if (qrCodeDataURL) {
    // Subtle background for QR
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(158, finalY - 10, 32, 32, 2, 2, "FD");

    // QR image
    doc.addImage(qrCodeDataURL, "PNG", 161, finalY - 7, 26, 26);

    // Label
    doc.setFontSize(5);
    doc.setTextColor(100, 100, 100);
    doc.text("Scan to Verify", 174, finalY + 25, { align: "center" });
  }

  // ============ VERIFICATION TEXT ============
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  const urlLines = doc.splitTextToSize(`Verify: ${verificationUrl}`, 170);
  doc.text(urlLines, 20, finalY + 35);

  // ============ WATERMARK ============
  addWatermark(doc);

  // ============ FOOTER ============
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 58, 138);
  doc.text("Thank you for your payment!", 105, finalY + 55, {
    align: "center",
  });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(
    "This is a system-generated receipt. For inquiries, please contact your landlord.",
    105,
    finalY + 65,
    { align: "center" },
  );
  doc.text("NyumbaFlow - Smart Property Management System", 105, finalY + 75, {
    align: "center",
  });

  // ============ SAVE PDF ============
  doc.save(`receipt-${data.receiptNo}.pdf`);
};
