import { Router } from 'express';
import { prisma } from '../index';

const router = Router();

// Get all payments
router.get('/', async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        tenant: { select: { id: true, name: true, email: true } },
        house: { select: { id: true, name: true } }
      },
      orderBy: { date: 'desc' }
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
});

// Get payments for specific tenant
router.get('/tenant/:tenantId', async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { tenantId: req.params.tenantId },
      include: { house: true },
      orderBy: { date: 'desc' }
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tenant payments' });
  }
});

// Create payment
router.post('/', async (req, res) => {
  try {
    const { tenantId, houseId, amount, method, month, date } = req.body;
    
    // Generate receipt number
    const receiptNo = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const payment = await prisma.payment.create({
      data: {
        tenantId,
        houseId,
        amount: parseFloat(amount),
        method,
        month: new Date(month),
        date: new Date(date),
        receiptNo,
        status: 'PAID'
      },
      include: {
        tenant: { select: { name: true, email: true } },
        house: true
      }
    });
    res.status(201).json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create payment' });
  }
});

// Update payment status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const payment = await prisma.payment.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update payment status' });
  }
});

export default router;