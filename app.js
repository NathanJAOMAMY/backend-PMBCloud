const env = require("dotenv");
env.config();
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");
const socketInit = require("./src/sockets/sockets.js");
const socialMediaRoutes = require("./src/routes/socialMedia.js");
const userRouter = require("./src/routes/userRoute.js");
const file = require("./src/routes/file.js");
const code = require("./src/routes/codeInscription.js");
const folder = require("./src/routes/folder.js");
const chat = require("./src/routes/chat.js");
const connectMongo = require("./src/db/db.js");

connectMongo();
const port = process.env.PORT || 3001;

const app = express();
const server = http.createServer(app);

const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logSecurityEvent = (event, ip, details = '') => {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [SECURITY]  ${event} | IP: ${ip} ${details}\n`;

  console.log(logLine.trim());

  try {
    const logsDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const logFile = path.join(logsDir, 'security.log');
    fs.appendFileSync(logFile, logLine);
  } catch (err) {
    console.error('Erreur lors de l\'écriture du journal de sécurité :', err);
  }
};

// CORS sécurisé
const allowedOrigins = [
  "http://localhost:5173",
  // "http://localhost:8080",
  // "https://intranet.promabio.com"
];

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST"],
    credentials: true
  },
});

socketInit(io);

app.use(helmet());
app.disable("x-powered-by");

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes max par IP pour toutes les routes
  message: { error: 'Trop de requêtes, réessayez plus tard' },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max
  message: { error: 'Trop de tentatives, réessayez plus tard' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

// Middlewares
app.use((req, res, next) => {
  // Log les tentatives rate limited
  res.on('finish', () => {
    if (res.statusCode === 429) {
      logSecurityEvent('RATE_LIMITED', req.ip, `Path: ${req.path}`);
    }
    if (res.statusCode === 401 || res.statusCode === 403) {
      logSecurityEvent('AUTH_FAILED', req.ip, `Path: ${req.path} | Status: ${res.statusCode}`);
    }
  });
  next();
});

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(generalLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'pmbcloud-backend'
  });
});

// Routes
app.use("/auth", authLimiter, userRouter);
app.use("/users", authLimiter, userRouter);
app.use("/folder", folder);
app.use("/file", file);
app.use("/code", code);
app.use("/chat", chat);
app.use("/social", socialMediaRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  logSecurityEvent('SERVER_ERROR', req.ip, `Path: ${req.path} | Error: ${error.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

server.listen(port, () => {
  console.log(`Serveur lancé sur le port ${port}`);
  logSecurityEvent('APP_START', 'system', `port ${port}`);
});