import { Router } from "express";
import { prisma } from "../index";

const router = Router();

// Get all houses
router.get("/", async (req, res) => {
  try {
    const houses = await prisma.house.findMany({
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });
    res.json(houses);
  } catch (error) {
    console.error("Error fetching houses:", error);
    res.status(500).json({ message: "Failed to fetch houses" });
  }
});

// Get single house
router.get("/:id", async (req, res) => {
  try {
    const house = await prisma.house.findUnique({
      where: { id: req.params.id },
      include: {
        tenant: true,
        payments: true,
        complaints: true,
      },
    });
    if (!house) {
      return res.status(404).json({ message: "House not found" });
    }
    res.json(house);
  } catch (error) {
    console.error("Error fetching house:", error);
    res.status(500).json({ message: "Failed to fetch house" });
  }
});

// Create house
router.post("/", async (req, res) => {
  try {
    const { name, address, type, rent, description, amenities } = req.body;

    const house = await prisma.house.create({
      data: {
        name,
        address,
        type,
        rent: parseFloat(rent),
        description,
        amenities: amenities || [],
        status: "VACANT",
      },
    });
    res.status(201).json(house);
  } catch (error) {
    console.error("Error creating house:", error);
    res.status(500).json({ message: "Failed to create house" });
  }
});

// Update house - FIXED VERSION
router.put("/:id", async (req, res) => {
  try {
    const {
      name,
      address,
      type,
      rent,
      description,
      amenities,
      status,
      tenantId,
    } = req.body;

    console.log("📝 Updating house:", req.params.id);
    console.log("Received tenantId:", tenantId);
    console.log("Received status:", status);

    // Build update data object
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (type !== undefined) updateData.type = type;
    if (rent !== undefined) updateData.rent = parseFloat(rent);
    if (description !== undefined) updateData.description = description;
    if (amenities !== undefined) updateData.amenities = amenities;
    if (status !== undefined) updateData.status = status;

    // Handle tenantId - can be null or string
    if (tenantId !== undefined) {
      updateData.tenantId =
        tenantId === null || tenantId === "" ? null : tenantId;
    }

    console.log("Update data:", updateData);

    const house = await prisma.house.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        tenant: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    console.log("✅ Updated house successfully. New tenantId:", house.tenantId);
    res.json(house);
  } catch (error) {
    console.error("❌ Failed to update house:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res
      .status(500)
      .json({ message: "Failed to update house", error: errorMessage });
  }
});

// Delete house
router.delete("/:id", async (req, res) => {
  try {
    const houseId = req.params.id;

    console.log("🗑️ Deleting house:", houseId);

    // Check if house exists
    const house = await prisma.house.findUnique({
      where: { id: houseId },
      include: {
        payments: true,
        complaints: true,
      },
    });

    if (!house) {
      return res.status(404).json({ message: "House not found" });
    }

    // Check if house has related records
    if (house.payments.length > 0 || house.complaints.length > 0) {
      return res.status(400).json({
        message:
          "Cannot delete house with existing payments or complaints. Please delete them first.",
      });
    }

    // Delete the house
    await prisma.house.delete({
      where: { id: houseId },
    });

    console.log("✅ House deleted successfully");
    res.json({ message: "House deleted successfully" });
  } catch (error) {
    console.error("❌ Failed to delete house:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res
      .status(500)
      .json({ message: "Failed to delete house", error: errorMessage });
  }
});

export default router;
