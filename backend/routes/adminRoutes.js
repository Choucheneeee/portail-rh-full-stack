const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const adminController = require("../controllers/adminController");
const { allusers,updateruser,deleteuser,getData } = require("../controllers/adminController");

// router.get("/getuser", authMiddleware, getuser);

router.get("/allusers", authMiddleware, allusers);
router.put("/updateruser", authMiddleware, updateruser);
router.delete("/deleteuser/:userId", authMiddleware, deleteuser);

router.get("/dashData",authMiddleware,getData)

router.put("/updateruser/:id", authMiddleware, updateruser);


/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management endpoints
 */

/**
 * @swagger
 * /admin/allusers:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, collaborateur, rh]
 *         description: Filter by user role
 *       - in: query
 *         name: isApproved
 *         schema:
 *           type: boolean
 *         description: Filter by approval status
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin access required)
 */

/**
 * @swagger
 * /admin/updateruser:
 *   put:
 *     summary: Update user information (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 required: true
 *                 example: "507f1f77bcf86cd799439011"
 *               updates:
 *                 type: object
 *                 properties:
 *                   firstName:
 *                     type: string
 *                     example: "John"
 *                   lastName:
 *                     type: string
 *                     example: "Doe"
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: "john.doe@example.com"
 *                   role:
 *                     type: string
 *                     enum: [admin, collaborateur, rh]
 *                     example: "collaborateur"
 *                   isApproved:
 *                     type: boolean
 *                     example: true
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin access required)
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /admin/deleteuser/{userId}:
 *   delete:
 *     summary: Delete a user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to delete
 *     responses:
 *       204:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin access required)
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /admin/dashData:
 *   get:
 *     summary: Get dashboard statistics (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: integer
 *                   example: 42
 *                 activeUsers:
 *                   type: integer
 *                   example: 35
 *                 en attenteApprovals:
 *                   type: integer
 *                   example: 7
 *                 recentRegistrations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin access required)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         firstName:
 *           type: string
 *           example: "John"
 *         lastName:
 *           type: string
 *           example: "Doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "john.doe@example.com"
 *         role:
 *           type: string
 *           enum: [admin, collaborateur, rh]
 *           example: "collaborateur"
 *         isVerified:
 *           type: boolean
 *           example: true
 *         isApproved:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2023-08-20T10:30:00Z"
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

module.exports = router;
