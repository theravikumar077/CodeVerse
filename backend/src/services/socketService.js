const { Server } = require('socket.io');

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // In production, replace with specific frontend domains
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    // Join workspace room
    socket.on('join-project', ({ projectId, username }) => {
      socket.join(projectId);
      socket.projectId = projectId;
      socket.username = username;
      console.log(`User ${username} joined project: ${projectId}`);
      
      // Notify other room members
      socket.to(projectId).emit('user-joined', { socketId: socket.id, username });
    });

    // Notify room of active edits
    socket.on('file-modified', ({ projectId, filePath, content }) => {
      // Sync file changes in real time for open collaborative sessions
      socket.to(projectId).emit('file-synced', { filePath, content });
    });

    // Handle cursor tracking
    socket.on('cursor-move', ({ projectId, filePath, cursor }) => {
      socket.to(projectId).emit('cursor-moved', {
        socketId: socket.id,
        username: socket.username,
        filePath,
        cursor,
      });
    });

    // Clean up on disconnect
    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
      if (socket.projectId && socket.username) {
        socket.to(socket.projectId).emit('user-left', {
          socketId: socket.id,
          username: socket.username,
        });
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet!');
  }
  return io;
};

module.exports = {
  initSocket,
  getIO,
};
