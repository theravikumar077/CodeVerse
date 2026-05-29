require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { initSocket } = require('./services/socketService');
const { initPtyService } = require('./services/ptyService');

// Routes
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const gitRoutes = require('./routes/gitRoutes');
const aiRoutes = require('./routes/aiRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

// Initialize database connection
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Sockets
const io = initSocket(server);
initPtyService(io);

// Middleware
app.use(cors({ origin: '*' })); // Custom frontend URLs in production
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Uploads (Avatars, public files)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

const { servePreviewFile } = require('./services/liveServerService');

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/git', gitRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/settings', settingsRoutes);
app.get('/preview/:projectId/*', servePreviewFile);

// Root route
app.get('/', (req, res) => {
  res.send('RR CodeVerse IDE backend API is running...');
});

// Graceful global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
