const express = require('express');
const authController = require('../controllers/authController');
const validation = require('../middleware/validation');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Rutas públicas
router.post('/register', validation.validateRegister, authController.register);
router.post('/login', validation.validateLogin, authController.login);
router.post('/forgot-password', validation.validateForgotPassword, authController.forgotPassword);
router.put('/reset-password/:resetToken', validation.validateResetPassword, authController.resetPassword);

// Rutas protegidas
router.get('/me', protect, authController.getCurrentUser);
router.put('/change-password', protect, validation.validateChangePassword, authController.changePassword);

module.exports = router;