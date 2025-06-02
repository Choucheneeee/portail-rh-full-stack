const express = require("express");
const router = express.Router();
const {
getAllRequests,updateRequest,deleteRequest,getMyRequests
} = require("../controllers/demandeController");

const auth = require("../middleware/auth");



router.get("/", auth, getAllRequests);

router.put("/:id", auth, updateRequest);

router.delete("/deletereq/:endpoint/:id", auth, deleteRequest);

router.get("/myrequests", auth, getMyRequests);


module.exports = router;