'use strict';

const { Router } = require('express');
const authenticate = require('../middlewares/authenticate');
const validateBody = require('../middlewares/validate-body');
const categoryController = require('../controllers/category-controller');

const router = Router();

router.use(authenticate);

router.get('/', categoryController.getCategories);
router.post('/', validateBody(['name']), categoryController.createCategory);
router.patch('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
