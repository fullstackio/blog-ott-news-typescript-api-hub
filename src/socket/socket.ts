import { Server } from 'socket.io';

let io: Server;

export const setSocketIoInstance = (ioInstance: Server) => {
  io = ioInstance;
};

export const getSocketIoInstance = (): Server => {
  if (!io) {
    throw new Error('Socket.IO instance not set!');
  }
  return io;
};
