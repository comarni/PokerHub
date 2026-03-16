import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import handRoutes from './routes/hand';
import betRoutes from './routes/bet';
import statsRoutes from './routes/stats';
import { initSocketEvents } from './socket/events';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/hand', handRoutes);
app.use('/bet', betRoutes);
app.use('/stats', statsRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io
initSocketEvents(io);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`PokerHub server running on port ${PORT}`);
});

export { io };
