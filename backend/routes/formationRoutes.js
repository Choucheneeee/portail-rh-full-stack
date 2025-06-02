// Routes de gestion des demandes
const express = require("express");
const Formation = require("../models/formation.model");
const router = express.Router();
const {  createformation,getformationById,updateformation } = require("../controllers/formationController");
const auth = require("../middleware/auth");


router.post("/", auth, createformation);

router.get("/:id",auth,getformationById);

router.put("/update/:id",auth,updateformation);



/**
 * @swagger
 * tags:
 *   name: Formations
 *   description: Formation management endpoints
 */

/**
 * @swagger
 * /formations:
 * 
 *   post:
 *     summary: Create a new formation request
 *     tags: [Formations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FormationInput'
 *     responses:
 *       201:
 *         description: Formation request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Formation'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */


/**
 * @swagger
 * components:
 *   schemas:
 *     Formation:
 *       type: object
 *       required:
 *         - user
 *         - titre
 *         - type
 *       properties:
 *         _id:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         user:
 *           type: string
 *           description: ID of the user requesting the formation
 *           example: 507f1f77bcf86cd799439011
 *         titre:
 *           type: string
 *           description: Title of the formation
 *           example: "Advanced React Development"
 *         type:
 *           type: string
 *           enum: [internal, external]
 *           description: Type of formation
 *           example: "external"
 *         date_Debut:
 *           type: string
 *           format: date
 *           description: Start date of the formation
 *           example: "2023-10-15"
 *         date_Fin:
 *           type: string
 *           format: date
 *           description: End date of the formation
 *           example: "2023-10-20"
 *         description:
 *           type: string
 *           description: Detailed description of the formation
 *           example: "This course covers advanced React patterns and state management"
 *         organisme:
 *           type: string
 *           description: Organization providing the formation
 *           example: "React Training Institute"
 *         cout:
 *           type: number
 *           description: Cost of the formation
 *           example: 1500.50
 *         status:
 *           type: string
 *           description: Current status of the formation request
 *           example: "en attente"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the request was created
 *           example: "2023-08-20T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the request was last updated
 *           example: "2023-08-20T10:30:00Z"
 *     FormationInput:
 *       type: object
 *       required:
 *         - titre
 *         - type
 *       properties:
 *         titre:
 *           type: string
 *           example: "Advanced React Development"
 *         type:
 *           type: string
 *           enum: [internal, external]
 *           example: "external"
 *         date_Debut:
 *           type: string
 *           format: date
 *           example: "2023-10-15"
 *         date_Fin:
 *           type: string
 *           format: date
 *           example: "2023-10-20"
 *         description:
 *           type: string
 *           example: "This course covers advanced React patterns and state management"
 *         organisme:
 *           type: string
 *           example: "React Training Institute"
 *         cout:
 *           type: number
 *           example: 1500.50
 *         status:
 *           type: string
 *           example: "en attente"
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

module.exports = router;