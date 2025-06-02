// Routes de gestion des demandes
const express = require("express");
const router = express.Router();
const {
  createfiche,
  createattestation,
  getdocument,
  getRequestById,
  updateRequest,
  createattestation_de_stage,
  deleteRequest,
  
} = require("../controllers/documentController");
const auth = require("../middleware/auth");

// Points de terminaison unifiés pour les demandes
router.post("/fiche_paie", auth, createfiche);
router.post("/attestation", auth, createattestation);
router.post("/attestation_de_stage", auth, createattestation_de_stage);

router.get("/:id", auth, getRequestById);


router.get("/get/:id",auth,getdocument)
router.delete("/:id", auth, deleteRequest);


/**
 * @swagger
 * tags:
 *   name: Documents
 *   description: Gestion des Documents des employés
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Demande:
 *       type: object
 *       required:
 *         - user
 *         - type
 *       properties:
 *         _id:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         user:
 *           type: string
 *           description: ID de l'utilisateur
 *           example: 507f1f77bcf86cd799439011
 *         type:
 *           type: string
 *           enum: [attestation, fiche_paie, certificat]
 *           description: Type de demande
 *           example: "fiche_paie"
 *         firstName:
 *           type: string
 *           description: Prénom de l'employé
 *           example: "Jean"
 *         lastName:
 *           type: string
 *           description: Nom de famille de l'employé
 *           example: "Dupont"
 *         periode:
 *           type: string
 *           enum: [mensuel, annuel]
 *           description: Période concernée
 *           example: "mensuel"
 *         mois:
 *           type: string
 *           description: Mois concerné
 *           example: "Janvier"
 *         annee:
 *           type: string
 *           description: Année concernée
 *           example: "2023"
 *         documenttDetails:
 *           type: string
 *           description: Détails supplémentaires
 *           example: "Besoin pour demande de prêt"
 *         status:
 *           type: string
 *           description: Statut de la demande
 *           example: "en_cours"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date de création
 *           example: "2023-08-20T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date de mise à jour
 *           example: "2023-08-20T10:30:00Z"
 * 
 *     DemandeFicheInput:
 *       type: object
 *       required:
 *         - type
 *         - periode
 *       properties:
 *         type:
 *           type: string
 *           enum: [fiche_paie]
 *           example: "fiche_paie"
 *         periode:
 *           type: string
 *           enum: [mensuel, annuel]
 *           example: "mensuel"
 *         mois:
 *           type: string
 *           example: "Janvier"
 *         annee:
 *           type: string
 *           example: "2023"
 *         documenttDetails:
 *           type: string
 *           example: "Besoin pour demande de prêt"
 * 
 *     DemandeAttestationInput:
 *       type: object
 *       required:
 *         - type
 *       properties:
 *         type:
 *           type: string
 *           enum: [attestation]
 *           example: "attestation"
 *         documenttDetails:
 *           type: string
 *           example: "Attestation de travail pour visa"
 * 
 *     DemandeCertificatInput:
 *       type: object
 *       required:
 *         - type
 *       properties:
 *         type:
 *           type: string
 *           enum: [certificat]
 *           example: "certificat"
 *         documenttDetails:
 *           type: string
 *           example: "Certificat de formation"
 * 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /demandes/fiche:
 *   post:
 *     summary: Créer une demande de fiche de paie
 *     tags: [Demandes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DemandeFicheInput'
 *     responses:
 *       201:
 *         description: Demande créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Demande'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 */

/**
 * @swagger
 * /demandes/attestation:
 *   post:
 *     summary: Créer une demande d'attestation
 *     tags: [Demandes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DemandeAttestationInput'
 *     responses:
 *       201:
 *         description: Demande créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Demande'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 */

/**
 * @swagger
 * /demandes/certif:
 *   post:
 *     summary: Créer une demande de certificat
 *     tags: [Demandes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DemandeCertificatInput'
 *     responses:
 *       201:
 *         description: Demande créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Demande'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 */

/**
 * @swagger
 * /demandes:
 *   get:
 *     summary: Lister toutes les demandes
 *     tags: [Demandes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [attestation, fiche_paie, certificat]
 *         description: Filtrer par type de demande
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filtrer par statut
 *     responses:
 *       200:
 *         description: Liste des demandes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Demande'
 *       401:
 *         description: Non autorisé
 */

/**
 * @swagger
 * /demandes/collaborator:
 *   get:
 *     summary: Lister les demandes d'un collaborateur
 *     tags: [Demandes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des demandes du collaborateur
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Demande'
 *       401:
 *         description: Non autorisé
 */

/**
 * @swagger
 * /demandes/{id}:
 *   get:
 *     summary: Obtenir une demande spécifique
 *     tags: [Demandes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la demande
 *     responses:
 *       200:
 *         description: Détails de la demande
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Demande'
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Demande non trouvée
 * 
 *   put:
 *     summary: Mettre à jour une demande
 *     tags: [Demandes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la demande
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Demande'
 *     responses:
 *       200:
 *         description: Demande mise à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Demande'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Demande non trouvée
 * 
 *   delete:
 *     summary: Supprimer une demande
 *     tags: [Demandes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la demande
 *     responses:
 *       204:
 *         description: Demande supprimée
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Demande non trouvée
 */
module.exports = router;