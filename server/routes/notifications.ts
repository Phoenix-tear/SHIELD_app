import { Router } from 'express';
import { prisma } from '../index';
import { validateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /notifications
router.get('/', validateToken, async (req: AuthRequest, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { riderId: req.rider.id },
      orderBy: [{ read: 'asc' }, { createdAt: 'desc' }],
    });
    const unreadCount = notifications.filter((n) => !n.read).length;
    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error('Notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PUT /notifications/:id/read
router.put('/:id/read', validateToken, async (req: AuthRequest, res) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    });
    res.json({ notification });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// PUT /notifications/read-all
router.put('/read-all', validateToken, async (req: AuthRequest, res) => {
  try {
    await prisma.notification.updateMany({
      where: { riderId: req.rider.id, read: false },
      data: { read: true },
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

export default router;
