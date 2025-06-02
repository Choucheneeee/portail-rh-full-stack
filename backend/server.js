require('dotenv').config({ path: '../.env' });
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("./routes/authRoutes");

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const app = express();

const path = require("path");
const http = require('http');
const server = http.createServer(app);
const User = require("./models/User.model");
 // Make sure this import exists

connectDB().then(() => {
    startScheduledTasks();
})
const io = require('socket.io')(server, {
  cors: {
    origin: "http://localhost:4200", // Your Angular app URL
    methods: ["GET", "POST"],
    credentials: true
  },
  path: '/socket.io'
});


const swaggerOptions  = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Portail Rh Documentation',
      version: '1.0.0',
      description: 'Portail Rh documentation API Node.js backend',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./routes/*.js'], // Path to your route files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Initialize scheduled tasks
const startScheduledTasks = require('./utils/scheduledTasks');

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Middleware to get user ID from query parameter (for testing)
io.use((socket, next) => {
    // Get user details from client connection
    const userId = socket.handshake.query.userId;
    const role = socket.handshake.query.role; // 'admin' or 'collaborateur'
    
    if (!userId || !role) return next(new Error("Authentification requise"));
    
    socket.userId = userId;
    socket.role = role;
    next();
  });

let userConnections = new Map(); // Map to track online users and their socket IDs
let userSockets = new Map(); // Map to track user's socket connections

// Modify the socket connection handlers
io.on('connection', (socket) => {
    const { userId, role } = socket.handshake.auth;
    if (!userId || !role) {
        socket.disconnect(true);
        console.log("Authentification requise");
        return;
    }
    console.log(`${role} ${userId} connecté`);

    // Store socket reference for this user
    if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);

    // Add user to connections map only if they weren't already connected
    if (!userConnections.has(userId)) {
        userConnections.set(userId, true);
        io.emit('online-users', Array.from(userConnections.keys()));
    }
    
    // Join rooms
    const userRoom = `user_${userId}`;
    socket.join(userRoom);
    
    if (role === 'admin') socket.join('admins');
    if (role === 'rh') socket.join('rhs');
    if (role === 'collaborateur') socket.join('collaborateurs');

    // Gestion des messages
    socket.on('chat-message', (data) => {
        console.log('Message reçu:', {
            de: userId,
            à: data.recipientId,
            contenu: data.message
        });

        const recipientRoom = `user_${data.recipientId}`;
        socket.to(recipientRoom).emit('chat-message', {
            senderId: userId,
            message: data.message,
            timestamp: new Date().toISOString()
        });
    });

    // Gestion des utilisateurs en ligne
    socket.on('request-online-users', () => {
        socket.emit('online-users', Array.from(userConnections.keys()));
    });

    // Gestion des notifications
    socket.on('notif', async (data) => {
        try {
            console.log(`\n--- NOUVELLE NOTIFICATION ---`);
            console.log(`Expéditeur: ${role} ${userId}`);
            console.log(`Contenu:`, JSON.stringify(data, null, 2));

            if (role === 'admin' || role === 'rh') {
                if (data.type === 'new_user_approval') {
                    const targetRoom = role === 'admin' ? 'admins' : 'rhs';
                    io.to(targetRoom).emit('notif', {
                        type: 'new_user_approval',
                        message: data.message,
                        timestamp: new Date().toISOString()
                    });
                    console.log(`Notification sent to ${targetRoom} room`);
                } else if (data.targetUserId) {
                    const targetRoom = `user_${data.targetUserId}`;
                    const socketsInRoom = await io.in(targetRoom).allSockets();
                    
                    if (socketsInRoom.size === 0) {
                        console.warn(`L'utilisateur cible ${data.targetUserId} n'est pas connecté!`);
                        return;
                    }

                    io.to(targetRoom).emit('notif', {
                        type: data.type,
                        message: data.message,
                        senderId: userId,
                        timestamp: new Date().toISOString()
                    });
                }
            } else if (role === 'collaborateur') {

                // Remove the fallback broadcast to all RHs
               if (data.targetUserId) {
                    const targetRoom = `user_${data.targetUserId}`;
                    const socketsInRoom = await io.in(targetRoom).allSockets();
                    
                    if (socketsInRoom.size === 0) {
                        console.warn(`L'utilisateur cible ${data.targetUserId} n'est pas connecté!`);
                        return;
                    }

                    io.to(targetRoom).emit('notif', {
                        type: data.type,
                        message: data.message,
                        senderId: userId,
                        timestamp: new Date().toISOString()
                    });
                } else {
                    // If no specific RH is targeted, return an error
                    socket.emit('error', { 
                        message: 'Veuillez spécifier un destinataire RH pour votre message.'
                    });
                }
            }
        } catch (error) {
            console.error("[ERREUR DE NOTIFICATION]", error.message);
            socket.emit('error', { message: error.message });
        }
    });

    // Modify the disconnect handler
    socket.on('disconnect', () => {
        console.log(`${role} ${userId} déconnecté`);
        
        const userSocketSet = userSockets.get(userId);
        if (userSocketSet) {
            userSocketSet.delete(socket.id);
            
            if (userSocketSet.size === 0) {
                userSockets.delete(userId);
                userConnections.delete(userId);
                io.emit('online-users', Array.from(userConnections.keys()));
            }
        }

        socket.leave(userRoom);
        if (role === 'admin') socket.leave('admins');
        if (role === 'collaborateur') socket.leave('collaborateurs');
        if (role === 'rh') socket.leave('rhs');
    });

    // ...rest of your socket event handlers...
});
  
// Modify the existing /api/online-users endpoint
app.get('/api/online-users', async (req, res) => {
    try {
        // Get user details for online users
        const onlineUserIds = Array.from(userConnections.keys());
        const onlineUsers = await User.find({ _id: { $in: onlineUserIds } })
            .select('nom prenom email role imageUrl'); // Select the fields you need

        res.json(onlineUsers);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération des utilisateurs en ligne' 
        });
    }
});

// Add new endpoint for updating online status
app.post('/api/online-status', (req, res) => {
    try {
        const userId = req.user?._id; // Assuming you have authentication middleware
        const { status } = req.body;

        if (!userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Utilisateur non authentifié' 
            });
        }

        if (status) {
            // User is coming online
            const connections = userConnections.get(userId) || 0;
            userConnections.set(userId, connections + 1);
        } else {
            // User is going offline
            userConnections.delete(userId);
        }

        // Emit updated online users list to all connected clients
        io.emit('online-users', Array.from(userConnections.keys()));

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la mise à jour du statut' 
        });
    }
});

app.use(cors("*"));
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));


app.use('/api-docs', 
  swaggerUi.serve, 
  swaggerUi.setup(swaggerSpec) // Use the generated specs
);

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/message", require("./routes/messagesRoutes"));
app.use("/api/notification", require("./routes/notificationRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/document", require("./routes/documentRoutes"));
app.use("/api/formation",require("./routes/formationRoutes"));
app.use("/api/conge", require("./routes/congeRoutes"));
app.use("/api/avance", require("./routes/avanceRoute"));
app.use("/api/demande", require("./routes/demandeRoutes"));
app.use("/api/bot", require("./routes/botRoutes"));
app.get('/test-db', async (req, res) => {
    try {
      const count = await User.countDocuments();
      const sampleUser = await User.findOne();
      
      res.json({
        dbConnection: "OK",
        userCount: count,
        sampleUser: sampleUser ? "Exists" : "No users"
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

const PORT = process.env.PORT;
server.listen(PORT, () => {
    console.log('Swagger UI available at http://localhost:3000/api-docs');
    console.log(`Serveur en cours d'exécution sur le port ${PORT}`)
});

module.exports = { io };