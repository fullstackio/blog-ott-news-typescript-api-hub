import dotenv from 'dotenv';
dotenv.config();
import colors from 'colors';
import http from 'http';
import { Server } from 'socket.io';
import connectDB  from './config/db';
import { setSocketIoInstance } from './socket/socket';
import app from './app';
import logger from './utils/logger';




const PROTOCOL = 'http'; // or https
const HOST = '127.0.0.1';
const PORT = process.env.PORT || 5006;

const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: '*', // allow all origins for now (you can restrict later)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'FIND']
  }
});

// Store `io` globally so it can be used in routes/middlewares
setSocketIoInstance(io);



// Database connected and Server Running
connectDB()
.then(()=>{
  server.listen(PORT, () => {
    try {
      console.log(colors.yellow(`Server is running at `), colors.bgGreen(`${PROTOCOL}://${HOST}:${PORT}`));
      logger.info(`Server log at ${PROTOCOL}://${HOST}:${PORT}`);
    } catch (err) {
      console.error("Internal Server Error from API Server", err);
    }
  });
})
.catch((err)=>{
  console.log(colors.red(`Failed to connect database`),err.message)
})
