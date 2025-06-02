const express = require("express");
const router = express.Router();
const {  createavance,getAvanceById,updateAvance } = require("../controllers/avanceCotroller");
const auth = require("../middleware/auth");


router.post("/", auth, createavance);
router.get("/:id",auth,getAvanceById)
router.put("/update/:id",auth,updateAvance)

module.exports = router;
