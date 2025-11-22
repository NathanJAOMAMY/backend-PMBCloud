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
const port = process.env.PORT || 3001
// pour le socket.io
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
// le cors
app.use(
  cors({
    origin: "http://localhost:5173",
    // origin: "https://intranet.promabio.com",
    credentials: true,
  })
);
socketInit(io);

app.use(express.json());
app.use("/auth", userRouter);
app.use("/users", userRouter);
app.use("/folder", folder);
app.use("/file", file);
app.use("/code", code);
app.use("/chat", chat);
app.use("/social", socialMediaRoutes);

server.listen(port, () => {
  console.log(`Serveur lancer ${port}`);
});
