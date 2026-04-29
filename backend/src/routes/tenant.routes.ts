import { Router } from "express";
import { prisma } from "../index";

const router = Router();

// Get all tenants
router.get("/", async (req, res) => {
  try {
    const tenants = await prisma.user.findMany({
      where: { role: "TENANT" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        house: true,
      },
    });
    res.json(tenants);
  } catch (error) {
    console.error("Failed to fetch tenants:", error);
    res.status(500).json({ message: "Failed to fetch tenants" });
  }
});

// Get single tenant
router.get("/:id", async (req, res) => {
  try {
    const tenant = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        house: true,
        payments: true,
        complaints: true,
      },
    });
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }
    res.json(tenant);
  } catch (error) {
    console.error("Failed to fetch tenant:", error);
    res.status(500).json({ message: "Failed to fetch tenant" });
  }
});

// Update tenant
router.put("/:id", async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const tenant = await prisma.user.update({
      where: { id: req.params.id },
      data: { name, email, phone },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });
    res.json(tenant);
  } catch (error) {
    console.error("Failed to update tenant:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res
      .status(500)
      .json({ message: "Failed to update tenant", error: errorMessage });
  }
});

// DELETE TENANT - FIXED VERSION
router.delete("/:id", async (req, res) => {
  try {
    const tenantId = req.params.id;

    console.log("🗑️ Deleting tenant:", tenantId);

    // First verify this is a TENANT, not a landlord
    const user = await prisma.user.findUnique({
      where: { id: tenantId },
      select: { role: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "TENANT") {
      return res.status(400).json({ message: "Cannot delete landlord users" });
    }

    // Use transaction to delete all related records
    await prisma.$transaction([
      // 1. Unassign from house
      prisma.house.updateMany({
        where: { tenantId: tenantId },
        data: { tenantId: null, status: "VACANT" },
      }),

      // 2. Delete payments
      prisma.payment.deleteMany({
        where: { tenantId: tenantId },
      }),

      // 3. Delete complaints
      prisma.complaint.deleteMany({
        where: { tenantId: tenantId },
      }),

      // 4. Delete notice reads
      prisma.noticeRead.deleteMany({
        where: { tenantId: tenantId },
      }),

      // 5. Delete audit logs
      prisma.auditLog.deleteMany({
        where: { userId: tenantId },
      }),

      // 6. Finally delete the user
      prisma.user.delete({
        where: { id: tenantId },
      }),
    ]);

    console.log("✅ Tenant deleted successfully");
    res.json({ message: "Tenant deleted successfully" });
  } catch (error) {
    console.error("❌ Failed to delete tenant:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res
      .status(500)
      .json({ message: "Failed to delete tenant", error: errorMessage });
  }
});

export default router;
