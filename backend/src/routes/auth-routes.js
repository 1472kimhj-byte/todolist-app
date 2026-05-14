'use strict';

const { Router } = require('express');
const authController = require('../controllers/auth-controller');
const validateBody = require('../middlewares/validate-body');

const router = Router();

router.post('/register', validateBody(['email', 'password', 'name']), authController.register);
router.post('/login', validateBody(['email', 'password']), authController.login);
router.post('/logout', validateBody(['refreshToken']), authController.logout);
router.post('/refresh', validateBody(['refreshToken']), authController.refresh);

module.exports = router;
