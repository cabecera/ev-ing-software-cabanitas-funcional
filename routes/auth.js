const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/login', authController.showLogin);
router.post('/login', authController.login);
router.get('/registro', authController.showRegister);
router.post('/registro', authController.register);
router.get('/logout', authController.logout);

module.exports = router;

