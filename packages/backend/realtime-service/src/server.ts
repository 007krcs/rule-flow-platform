/**
 * Real-time Collaboration Service
 * WebSocket-based real-time collaboration with Yjs CRDT
 * Supports multiple users editing rules simultaneously
 */

import express, { Express } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'express';
import * as Y from 'yjs';
import { createClient } from 'redis';

const app: Express = express();
const httpServer = createServer(app);
const port = process.env.PORT || 3006;

app.use(cors());

// Redis for presence and state persistence
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

// Socket.IO server
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

// Active sessions storage
interface CollaborationSession {
  id: string;
  rulesetId: string;
  participants: Map<string, Participant>;
  ydoc: Y.Doc;
  lastActivity: number;
}

interface Participant {
  userId: string;
  username: string;
  socketId: string;
  cursor?: { x: number; y: number; ruleId?: string };
  color: string;
  joinedAt: number;
}

const sessions = new Map<string, CollaborationSession>();

// Generate random color for participant
function generateColor(): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Create or get session
function getSession(sessionId: string, rulesetId: string): CollaborationSession {
  if (!sessions.has(sessionId)) {
    const ydoc = new Y.Doc();
    sessions.set(sessionId, {
      id: sessionId,
      rulesetId,
      participants: new Map(),
      ydoc,
      lastActivity: Date.now()
    });
  }
  return sessions.get(sessionId)!;
}

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Join collaboration session
  socket.on('join-session', ({ sessionId, rulesetId, userId, username }) => {
    const session = getSession(sessionId, rulesetId);
    
    const participant: Participant = {
      userId,
      username,
      socketId: socket.id,
      color: generateColor(),
      joinedAt: Date.now()
    };

    session.participants.set(socket.id, participant);
    socket.join(sessionId);

    // Send current document state to new participant
    const stateVector = Y.encodeStateVector(session.ydoc);
    socket.emit('sync-state', {
      state: Y.encodeStateAsUpdate(session.ydoc, stateVector),
      participants: Array.from(session.participants.values()).map(p => ({
        userId: p.userId,
        username: p.username,
        color: p.color,
        cursor: p.cursor
      }))
    });

    // Notify others about new participant
    socket.to(sessionId).emit('user-joined', {
      userId,
      username,
      color: participant.color,
      timestamp: Date.now()
    });

    console.log(`User ${username} joined session ${sessionId}`);
  });

  // Handle document updates (CRDT)
  socket.on('document-update', ({ sessionId, update }) => {
    const session = sessions.get(sessionId);
    if (!session) return;

    // Apply update to Yjs document
    const updateArray = new Uint8Array(update);
    Y.applyUpdate(session.ydoc, updateArray);

    // Broadcast to other participants
    socket.to(sessionId).emit('document-update', {
      update,
      userId: session.participants.get(socket.id)?.userId
    });

    session.lastActivity = Date.now();
  });

  // Handle cursor movement
  socket.on('cursor-move', ({ sessionId, cursor }) => {
    const session = sessions.get(sessionId);
    if (!session) return;

    const participant = session.participants.get(socket.id);
    if (participant) {
      participant.cursor = cursor;
      
      socket.to(sessionId).emit('cursor-update', {
        userId: participant.userId,
        username: participant.username,
        cursor,
        color: participant.color
      });
    }
  });

  // Handle rule selection
  socket.on('rule-select', ({ sessionId, ruleId }) => {
    const session = sessions.get(sessionId);
    if (!session) return;

    const participant = session.participants.get(socket.id);
    if (participant) {
      socket.to(sessionId).emit('rule-selected', {
        userId: participant.userId,
        username: participant.username,
        ruleId,
        color: participant.color
      });
    }
  });

  // Handle rule editing
  socket.on('rule-edit', ({ sessionId, ruleId, field, value }) => {
    const session = sessions.get(sessionId);
    if (!session) return;

    const participant = session.participants.get(socket.id);
    
    // Update Yjs shared type
    const rulesMap = session.ydoc.getMap<Y.Map<any>>('rules');
    const ruleMap = (rulesMap.get(ruleId) || new Y.Map()) as Y.Map<any>;
    ruleMap.set(field, value);
    rulesMap.set(ruleId, ruleMap);

    socket.to(sessionId).emit('rule-edited', {
      userId: participant?.userId,
      username: participant?.username,
      ruleId,
      field,
      value,
      timestamp: Date.now()
    });
  });

  // Handle comments
  socket.on('add-comment', ({ sessionId, ruleId, comment }) => {
    const session = sessions.get(sessionId);
    if (!session) return;

    const participant = session.participants.get(socket.id);
    
    const commentData = {
      id: `comment_${Date.now()}`,
      userId: participant?.userId,
      username: participant?.username,
      comment,
      ruleId,
      timestamp: Date.now()
    };

    io.to(sessionId).emit('comment-added', commentData);
  });

  // Handle awareness (who's viewing what)
  socket.on('awareness-update', ({ sessionId, ruleId, action }) => {
    const session = sessions.get(sessionId);
    if (!session) return;

    const participant = session.participants.get(socket.id);
    
    socket.to(sessionId).emit('awareness-update', {
      userId: participant?.userId,
      username: participant?.username,
      ruleId,
      action, // 'viewing', 'editing', 'idle'
      color: participant?.color
    });
  });

  // Leave session
  socket.on('leave-session', ({ sessionId }) => {
    handleLeave(sessionId, socket.id);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    
    // Find and clean up from all sessions
    sessions.forEach((session, sessionId) => {
      if (session.participants.has(socket.id)) {
        handleLeave(sessionId, socket.id);
      }
    });
  });

  function handleLeave(sessionId: string, socketId: string) {
    const session = sessions.get(sessionId);
    if (!session) return;

    const participant = session.participants.get(socketId);
    if (participant) {
      session.participants.delete(socketId);
      socket.to(sessionId).emit('user-left', {
        userId: participant.userId,
        username: participant.username,
        timestamp: Date.now()
      });

      // Clean up empty sessions
      if (session.participants.size === 0) {
        sessions.delete(sessionId);
        console.log(`Session ${sessionId} cleaned up (no participants)`);
      }
    }

    socket.leave(sessionId);
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'realtime-collaboration',
    activeSessions: sessions.size,
    totalParticipants: Array.from(sessions.values())
      .reduce((sum, session) => sum + session.participants.size, 0)
  });
});

// Session info endpoint
app.get('/sessions/:sessionId', (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({
    id: session.id,
    rulesetId: session.rulesetId,
    participants: Array.from(session.participants.values()).map(p => ({
      userId: p.userId,
      username: p.username,
      color: p.color,
      cursor: p.cursor
    })),
    lastActivity: session.lastActivity
  });
});

// Cleanup stale sessions (no activity for 1 hour)
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  sessions.forEach((session, sessionId) => {
    if (session.lastActivity < oneHourAgo) {
      sessions.delete(sessionId);
      console.log(`Cleaned up stale session: ${sessionId}`);
    }
  });
}, 5 * 60 * 1000); // Check every 5 minutes

// Connect to Redis
redisClient.connect().then(() => {
  console.log('✓ Connected to Redis');
  
  httpServer.listen(port, () => {
    console.log(`✓ Real-time Collaboration Service listening on port ${port}`);
    console.log(`  WebSocket endpoint: ws://localhost:${port}`);
  });
}).catch(err => {
  console.error('Failed to connect to Redis:', err);
  // Start without Redis (in-memory only)
  httpServer.listen(port, () => {
    console.log(`✓ Real-time Collaboration Service listening on port ${port} (no Redis)`);
  });
});

export default app;
