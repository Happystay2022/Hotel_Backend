const cluster = require('cluster');
const os = require('os');
const numCPUs = os.cpus().length;

// Change to false to run without cluster for testing
const USE_CLUSTER = false;

if (USE_CLUSTER && cluster.isMaster) {
    // Fork workers
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    // Restart any worker that dies
    cluster.on('exit', (worker) => {
        cluster.fork();
    });

} else {
    // ===== Your Original Server Code =====
    const express = require('express');
    const http = require('http');
    const socketIo = require('socket.io');
    const cors = require('cors');
    const webSocketHandler = require('./controllers/chatApp/webSocket');
    const routes = require('./routes/index');
    const connectDB = require('./config/db');
    const mailerRoutes = require('./nodemailer/routes');
    const setupChatRoutes = require('./routes/chatApp/chatAppRoutes');

    // Create an Express application
    const app = express();
    const server = http.createServer(app);
    const io = socketIo(server, {
        cors: {
            origin: [
                'http://localhost:3030',
                'http://localhost:5173',
                'https://hotelroomsstay.com',
                'https://roomsstay.vercel.app'
            ],
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    // Middleware to log response time
    app.use((req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
        });
        next();
    });

    // Middleware
    app.use(cors());
    app.use(express.json());
    app.use('/mail', mailerRoutes);

    // Connect to the database
    connectDB()
        .then(() => console.log(`Database connected successfully - PID ${process.pid}`))
        .catch((err) => console.error('Database connection error:', err));

    // Set up WebSocket
    webSocketHandler(io);

    // Set up routes
    app.use('/', routes);
    app.use('/chatApp', setupChatRoutes(io));

    // Start the server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT} - PID ${process.pid}`);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
        server.close(() => {
            console.log(`Worker ${process.pid} closed`);
            process.exit(0);
        });
    });

    process.on('SIGTERM', () => {
        server.close(() => {
            console.log(`Worker ${process.pid} closed`);
            process.exit(0);
        });
    });
}
