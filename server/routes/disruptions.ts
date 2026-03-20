import { Router } from 'express';
import { validateToken, AuthRequest } from '../middleware/auth';

const router = Router();

const disruptions = [
  {
    id: 'disr-001',
    triggerType: 'HEAVY_RAINFALL',
    title: 'Heavy Rainfall Warning',
    description: 'IMD has issued a heavy rainfall alert for your area. Expected to continue for 3-4 hours.',
    severity: 'HIGH',
    zone: '560001',
    startedAt: new Date().toISOString(),
    signals: [
      'IMD Orange Alert — 115mm rainfall in 3 hours',
      '73% of riders in zone reporting zero orders',
      'Blinkit dark store picking speed down 60%',
    ],
  },
  {
    id: 'disr-002',
    triggerType: 'VIP_CONVOY',
    title: 'VIP Convoy — Road Closure',
    description: 'Major roads in your zone closed due to VIP movement. Expected duration: 2 hours.',
    severity: 'MEDIUM',
    zone: '560001',
    startedAt: new Date().toISOString(),
    signals: [
      'Traffic police advisory issued',
      'Google Maps showing 45-min delays on MG Road',
      '40% rider idle rate in your 3km radius',
    ],
  },
  {
    id: 'disr-003',
    triggerType: 'FLASH_FLOOD',
    title: 'Flash Flood Alert',
    description: 'Waterlogging reported in multiple areas of your pin code. Delivery operations severely affected.',
    severity: 'HIGH',
    zone: '560001',
    startedAt: new Date().toISOString(),
    signals: [
      'NDRF warning for your district',
      'Swiggy/Zomato paused orders in area',
      '90% of nearby riders showing idle status',
    ],
  },
];

// GET /disruptions/active
router.get('/active', validateToken, async (req: AuthRequest, res) => {
  try {
    const disruption = {
      ...disruptions[0],
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    };
    res.json({ active: true, disruption });
  } catch (err) {
    console.error('Disruptions error:', err);
    res.status(500).json({ error: 'Failed to fetch disruptions' });
  }
});

export default router;
