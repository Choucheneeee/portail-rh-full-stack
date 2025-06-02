// Routes de gestion des notifications
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require("../middleware/auth");

// Créer une notification
router.post("/send-notification", authMiddleware, notificationController.createNotification);

// Obtenir les notifications d'un utilisateur
router.get("/get-notification/:userId", notificationController.getNotifications);

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification management
 */

/**
 * @swagger
 * /notifications/send-notification:
 *   post:
 *     summary: Send a notification to a user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipient
 *               - message
 *             properties:
 *               recipient:
 *                 type: string
 *                 description: ID of the recipient user
 *                 example: 507f1f77bcf86cd799439011
 *               message:
 *                 type: string
 *                 description: Notification content
 *                 example: You have a new message
 *     responses:
 *       201:
 *         description: Notification created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid input
 */

/**
 * @swagger
 * /notifications/get-notification/{userId}:
 *   get:
 *     summary: Get user's notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to retrieve notifications for
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       required:
 *         - sender
 *         - recipient
 *         - message
 *       properties:
 *         sender:
 *           type: string
 *           description: ID of the sender user
 *           example: 507f1f77bcf86cd799439011
 *         recipient:
 *           type: string
 *           description: ID of the recipient user
 *           example: 507f1f77bcf86cd799439012
 *         message:
 *           type: string
 *           example: Your request has been approved
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2023-08-01T12:34:56Z
 *         isRead:
 *           type: boolean
 *           default: false
 */

module.exports = router;

