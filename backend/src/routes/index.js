'use strict';

const { Router } = require('express');

const router = Router();

router.use('/auth', require('./auth-routes'));
router.use('/users', require('./user-routes'));
router.use('/categories', require('./category-routes'));
router.use('/todos', require('./todo-routes'));

module.exports = router;
