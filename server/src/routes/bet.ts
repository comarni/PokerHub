import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { recommendBet } from '../engines/betRecommendation';

const router = Router();

// POST /bet/recommend
router.post('/recommend',
  body('winProbability').isFloat({ min: 0, max: 100 }),
  body('equity').isFloat({ min: 0, max: 100 }),
  body('potSize').isInt({ min: 0 }),
  body('callAmount').isInt({ min: 0 }),
  body('playerStack').isInt({ min: 0 }),
  body('phase').isIn(['preflop', 'flop', 'turn', 'river']),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const recommendation = recommendBet(req.body);
      res.json({ success: true, recommendation });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Recommendation failed' });
    }
  }
);

export default router;
