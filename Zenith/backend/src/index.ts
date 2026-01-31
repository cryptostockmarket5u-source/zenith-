import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all for dev
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Zenith Geospatial Server / Active / ' + new Date().toISOString());
});

import { registerUser } from './controllers/userController';
import { getWorldState, captureTerritory } from './controllers/territoryController';

app.post('/api/users', registerUser);
app.get('/api/world', getWorldState);
app.post('/api/capture', captureTerritory);

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Real-time location updates (for "Live Link" or generic multiplayer view)
    socket.on('updateLocation', (data) => {
        // Broadcast to others (excluding sender)
        socket.broadcast.emit('playerMoved', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
    console.log(`Zenith Server running on port ${PORT}`);
});
