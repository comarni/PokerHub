import { Router, Request, Response } from 'express';
import pool from '../models/database';

const router = Router();

// GET /stats/player/:id
router.get('/player/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT p.*, s.* FROM players p
       LEFT JOIN statistics s ON s.player_id = p.id
       WHERE p.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /stats/table/:id
router.get('/table/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT t.*,
        COUNT(h.id) as total_hands,
        AVG(h.pot_size) as avg_pot
       FROM tables t
       LEFT JOIN hands h ON h.table_id = t.id
       WHERE t.id = $1
       GROUP BY t.id`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Table not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /stats/leaderboard
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, username, chip_stack, wins, losses, win_rate
       FROM players ORDER BY chip_stack DESC LIMIT 10`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
