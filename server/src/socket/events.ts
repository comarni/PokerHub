import { Server, Socket } from 'socket.io';

interface TableState {
  tableId: string;
  players: Map<string, { socketId: string; seat: number; chips: number }>;
  pot: number;
  phase: string;
  communityCards: unknown[];
}

const tables = new Map<string, TableState>();

export function initSocketEvents(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Join a table
    socket.on('joinTable', ({ tableId, playerId, seat, chips }) => {
      socket.join(`table:${tableId}`);

      if (!tables.has(tableId)) {
        tables.set(tableId, {
          tableId,
          players: new Map(),
          pot: 0,
          phase: 'waiting',
          communityCards: []
        });
      }

      const table = tables.get(tableId)!;
      table.players.set(playerId, { socketId: socket.id, seat, chips });

      io.to(`table:${tableId}`).emit('playerJoined', {
        playerId,
        seat,
        chips,
        totalPlayers: table.players.size
      });

      console.log(`Player ${playerId} joined table ${tableId}`);
    });

    // Deal cards event
    socket.on('dealCards', ({ tableId, handData }) => {
      io.to(`table:${tableId}`).emit('cardsDealt', handData);
    });

    // Player bet
    socket.on('playerBet', ({ tableId, playerId, action, amount }) => {
      const table = tables.get(tableId);
      if (table) {
        if (action !== 'fold') {
          table.pot += amount || 0;
        }
        io.to(`table:${tableId}`).emit('betMade', {
          playerId,
          action,
          amount,
          newPot: table.pot
        });
      }
    });

    // Show cards
    socket.on('showCards', ({ tableId, playerId, cards }) => {
      io.to(`table:${tableId}`).emit('cardsShown', { playerId, cards });
    });

    // Update pot
    socket.on('updatePot', ({ tableId, amount }) => {
      const table = tables.get(tableId);
      if (table) {
        table.pot = amount;
        io.to(`table:${tableId}`).emit('potUpdated', { pot: table.pot });
      }
    });

    // Community cards
    socket.on('addCommunityCard', ({ tableId, card, phase }) => {
      const table = tables.get(tableId);
      if (table) {
        table.communityCards.push(card);
        table.phase = phase;
        io.to(`table:${tableId}`).emit('communityCardAdded', {
          card,
          phase,
          allCommunityCards: table.communityCards
        });
      }
    });

    // Leave table
    socket.on('leaveTable', ({ tableId, playerId }) => {
      socket.leave(`table:${tableId}`);
      const table = tables.get(tableId);
      if (table) {
        table.players.delete(playerId);
        io.to(`table:${tableId}`).emit('playerLeft', { playerId });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Player disconnected: ${socket.id}`);
      // Clean up player from all tables
      tables.forEach((table, tableId) => {
        table.players.forEach((player, playerId) => {
          if (player.socketId === socket.id) {
            table.players.delete(playerId);
            io.to(`table:${tableId}`).emit('playerLeft', { playerId });
          }
        });
      });
    });
  });
}
