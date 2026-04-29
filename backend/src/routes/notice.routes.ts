import { Router } from 'express';
import { prisma } from '../index';

const router = Router();

// Get all notices
router.get('/', async (req, res) => {
  try {
    const notices = await prisma.notice.findMany({
      include: {
        reads: {
          include: { tenant: { select: { id: true, name: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notices' });
  }
});

// Get notices for specific tenant
router.get('/tenant/:tenantId', async (req, res) => {
  try {
    const notices = await prisma.notice.findMany({
      where: { targetAll: true },
      include: {
        reads: {
          where: { tenantId: req.params.tenantId }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tenant notices' });
  }
});

// Create notice
router.post('/', async (req, res) => {
  try {
    const { title, message, type, targetAll } = req.body;
    
    const notice = await prisma.notice.create({
      data: {
        title,
        message,
        type,
        targetAll: targetAll !== false
      }
    });
    res.status(201).json(notice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create notice' });
  }
});

// Mark notice as read
router.post('/:noticeId/read/:tenantId', async (req, res) => {
  try {
    const { noticeId, tenantId } = req.params;
    
    const read = await prisma.noticeRead.upsert({
      where: {
        noticeId_tenantId: {
          noticeId,
          tenantId
        }
      },
      update: {},
      create: {
        noticeId,
        tenantId
      }
    });
    res.json(read);
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark notice as read' });
  }
});

export default router;