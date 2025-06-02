// Routes de gestion des messages
const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messagesController');
const authMiddleware = require('../middleware/auth'); // Middleware d'authentification

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Routes pour l'envoi et la réception des messages
router.post('/', messageController.sendMessage);
router.get('/:userId', messageController.getMessages);
router.delete('/delete/:id', messageController.deleteMessage);
router.get('/rh/allusers', messageController.getalluser); // Route pour récupérer tous les messages

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Message management endpoints
 */

/**
 * @swagger
 * /messages:
 *   post:
 *     summary: Send a new message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MessageInput'
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /messages/{userId}:
 *   get:
 *     summary: Get messages between authenticated user and specified user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the other user in the conversation
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of messages to return
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Only return messages before this timestamp
 *     responses:
 *       200:
 *         description: List of messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /messages/{messageId}:
 *   delete:
 *     summary: Delete a message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the message to delete
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *       401:
 *         description: Unauthorized or not message owner
 *       404:
 *         description: Message not found
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       required:
 *         - sender
 *         - receiver
 *         - content
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the message
 *           example: 507f1f77bcf86cd799439011
 *         sender:
 *           type: string
 *           description: ID of the sender user
 *           example: 507f1f77bcf86cd799439011
 *         receiver:
 *           type: string
 *           description: ID of the receiver user
 *           example: 507f1f77bcf86cd799439012
 *         content:
 *           type: string
 *           description: Message content
 *           example: Hello, how are you doing?
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: When the message was sent
 *           example: 2023-08-15T14:30:00Z
 *     MessageInput:
 *       type: object
 *       required:
 *         - receiver
 *         - content
 *       properties:
 *         receiver:
 *           type: string
 *           description: ID of the recipient user
 *           example: 507f1f77bcf86cd799439012
 *         content:
 *           type: string
 *           description: Message content
 *           example: Hello, how are you doing?
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
module.exports = router;