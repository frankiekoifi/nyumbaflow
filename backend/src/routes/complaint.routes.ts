import { Router } from 'express';
import { prisma } from '../index';

const router = Router();

// Get all complaints
router.get('/', async (req, res) => {
  try {
    const complaints = await prisma.complaint.findMany({
      include: {
        tenant: { select: { id: true, name: true, email: true, phone: true } },
        house: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch complaints' });
  }
});

// Get complaints for specific tenant
router.get('/tenant/:tenantId', async (req, res) => {
  try {
    const complaints = await prisma.complaint.findMany({
      where: { tenantId: req.params.tenantId },
      include: { house: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tenant complaints' });
  }
});

// Create complaint
router.post('/', async (req, res) => {
  try {
    const { tenantId, houseId, title, description, category, priority } = req.body;
    
    const complaint = await prisma.complaint.create({
      data: {
        tenantId,
        houseId,
        title,
        description,
        category,
        priority,
        status: 'OPEN'
      },
      include: {
        tenant: { select: { name: true, email: true } },
        house: true
      }
    });
    res.status(201).json(complaint);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create complaint' });
  }
});

// Update complaint status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const data: any = { status };
    
    if (status === 'RESOLVED') {
      data.resolvedAt = new Date();
    }
    
    const complaint = await prisma.complaint.update({
      where: { id: req.params.id },
      data
    });
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update complaint' });
  }
});

export default router;