import { Router } from 'express';
import { prisma } from '../index';

const router = Router();

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const totalTenants = await prisma.user.count({
      where: { role: 'TENANT' }
    });
    
    const totalHouses = await prisma.house.count();
    const occupiedHouses = await prisma.house.count({
      where: { status: 'OCCUPIED' }
    });
    const vacantHouses = await prisma.house.count({
      where: { status: 'VACANT' }
    });
    
    const totalRevenue = await prisma.payment.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true }
    });
    
    const pendingPayments = await prisma.payment.aggregate({
      where: { status: { in: ['PENDING', 'OVERDUE'] } },
      _sum: { amount: true }
    });
    
    const openComplaints = await prisma.complaint.count({
      where: { status: { not: 'RESOLVED' } }
    });
    
    const occupancyRate = totalHouses > 0 
      ? Math.round((occupiedHouses / totalHouses) * 100) 
      : 0;
    
    res.json({
      totalTenants,
      totalHouses,
      occupiedHouses,
      vacantHouses,
      totalRevenue: totalRevenue._sum.amount || 0,
      pendingPayments: pendingPayments._sum.amount || 0,
      openComplaints,
      occupancyRate
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// Get monthly revenue
router.get('/monthly-revenue', async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { status: 'PAID' },
      select: { amount: true, month: true }
    });
    
    // Group by month
    const monthlyData = new Map();
    payments.forEach(p => {
      const monthKey = p.month.toISOString().slice(0, 7);
      monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + p.amount);
    });
    
    const result = Array.from(monthlyData.entries()).map(([month, revenue]) => ({
      month,
      revenue
    }));
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch monthly revenue' });
  }
});

export default router;