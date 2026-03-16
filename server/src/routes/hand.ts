import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { evaluateHand } from '../engines/handEvaluator';
import { runMonteCarlo } from '../engines/monteCarlo';

const router = Router();

// POST /hand/analyze
router.post('/analyze',
  body('playerCards').isArray({ min: 2, max: 2 }),
  body('communityCards').isArray({ min: 0, max: 5 }),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { playerCards, communityCards = [] } = req.body;
      const result = evaluateHand(playerCards, communityCards);
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Hand evaluation failed' });
    }
  }
);

// POST /hand/simulate
router.post('/simulate',
  body('playerCards').isArray({ min: 2, max: 2 }),
  body('communityCards').isArray({ min: 0, max: 5 }),
  body('numOpponents').isInt({ min: 1, max: 8 }),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { playerCards, communityCards = [], numOpponents = 1, iterations = 10000 } = req.body;
      const result = runMonteCarlo({ playerCards, communityCards, numOpponents, iterations });
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Simulation failed' });
    }
  }
);

export default router;
