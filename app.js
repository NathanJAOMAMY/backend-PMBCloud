const env = require("dotenv");
env.config();
const express = require("express");
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

// Middlewares
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'pmbcloud-backend'
  });
});

// Routes
app.use("/auth", userRouter);
app.use("/users", userRouter);
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
  res.status(500).json({ error: 'Internal server error' });
});

server.listen(port, () => {
  console.log(`Serveur lancé sur le port ${port}`);
});