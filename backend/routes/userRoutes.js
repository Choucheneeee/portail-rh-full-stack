// Routes de gestion des utilisateurs
const express = require("express");
const { getuser, updateuser, allusers, approveUser,getuserRh, deleteuser,updateuserRh,allusersRh,addsignature } = require("../controllers/userController");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const upload = require('../utils/upload');
const nestFormatter = require('../utils/nestFormatter');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */

/**
 * @swagger
 * /users/getuser:
 *   get:
 *     summary: Get authenticated user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get("/getuser", authMiddleware, getuser);
router.post("/addsignature", authMiddleware, addsignature);


router.get("/getuserRh/:userId", authMiddleware, getuserRh);
/**
 * @swagger
 * /users/allusers:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
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
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
// router.get("/allusers", authMiddleware, allusers);
router.get("/rh/allusers", authMiddleware, allusersRh);


/**
 * @swagger
 * /users/updateuser:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profileImage:
 *                 type: string
 *                 format: binary
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input
 */
router.put("/updateuser", authMiddleware, upload.single('profileImage'), nestFormatter, updateuser);

router.put("/updateuser/:userId", authMiddleware, upload.single('profileImage'), nestFormatter, updateuserRh);

/**
 * @swagger
 * /users/approveuser:
 *   put:
 *     summary: Approve a user
 *     tags: [Users]
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
 *                 description: ID of the user to approve
 *             required:
 *               - userId
 *     responses:
 *       200:
 *         description: User approved successfully
 *       404:
 *         description: User not found
 */
router.put("/approveuser", authMiddleware, approveUser);

/**
 * @swagger
 * /users/deleteuser/{userId}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Users]
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
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
router.delete("/deleteuser/:userId", authMiddleware, deleteuser);

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - cin
 *         - email
 *         - password
 *         - role
 *       properties:
 *         firstName:
 *           type: string
 *           example: John
 *         lastName:
 *           type: string
 *           example: Doe
 *         cin:
 *           type: integer
 *           format: int64
 *           unique: true
 *           example: 12345678
 *         email:
 *           type: string
 *           format: email
 *           example: john.doe@example.com
 *         password:
 *           type: string
 *           format: password
 *           writeOnly: true
 *         isVerified:
 *           type: boolean
 *           default: false
 *         profileImage:
 *           type: string
 *           format: uri
 *           example: https://example.com/profile.jpg
 *         isApproved:
 *           type: boolean
 *           default: false
 *         verificationCode:
 *           type: string
 *           writeOnly: true
 *         role:
 *           type: string
 *           enum: [admin, collaborateur, rh]
 *           example: collaborateur
 *         resetToken:
 *           type: string
 *           writeOnly: true
 *         resetTokenExpiration:
 *           type: string
 *           format: date-time
 *         personalInfo:
 *           type: object
 *           properties:
 *             phone:
 *               type: string
 *               example: "+212612345678"
 *             countryCode:
 *               type: string
 *               example: "MA"
 *             address:
 *               type: string
 *               example: "123 Main Street, Casablanca"
 *             birthDate:
 *               type: string
 *               format: date-time
 *               example: "1990-01-01T00:00:00Z"
 *         financialInfo:
 *           type: object
 *           properties:
 *             RIB:
 *               type: string
 *               example: "123456789012345678901234"
 *             bankAccount:
 *               type: string
 *               example: "Bank Al-Maghrib"
 *             taxId:
 *               type: string
 *               example: "ABCD1234"
 *             CNSS:
 *               type: string
 *               example: "CNSS-123456"
 *             paymentMethod:
 *               type: string
 *               example: "Bank Transfer"
 *             contractType:
 *               type: string
 *               example: "CDI"
 *             transportAllowance:
 *               type: number
 *               example: 1500.50
 *         professionalInfo:
 *           type: object
 *           properties:
 *             position:
 *               type: string
 *               example: "Software Engineer"
 *             department:
 *               type: string
 *               example: "IT"
 *             hiringDate:
 *               type: string
 *               format: date-time
 *               example: "2020-01-01T00:00:00Z"
 *             salary:
 *               type: number
 *               example: 25000.00
 *             jobDescription:
 *               type: object
 *               properties:
 *                 responsibilities:
 *                   type: array
 *                   items:
 *                     type: string
 *                     example: "Develop and maintain software applications"
 *                 qualifications:
 *                   type: array
 *                   items:
 *                     type: string
 *                     example: "Bachelor's degree in Computer Science"
 *                 effectiveDate:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-01-01T00:00:00Z"
 *         socialInfo:
 *           type: object
 *           properties:
 *             maritalStatus:
 *               type: string
 *               example: "Married"
 *             children:
 *               type: integer
 *               example: 2
 *         timeOffBalance:
 *           type: number
 *           default: 28
 *           example: 25.5
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2023-01-01T00:00:00Z"
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

module.exports = router;