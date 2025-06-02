
const express = require('express');
const router = express.Router();
const {sendMessage} = require('../controllers/botController');
const auth = require("../middleware/auth");

router.post('/send-message', auth, sendMessage);

module.exports = router;