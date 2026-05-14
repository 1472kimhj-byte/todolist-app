'use strict';

const { Router } = require('express');
const authenticate = require('../middlewares/authenticate');
const validateBody = require('../middlewares/validate-body');
const todoController = require('../controllers/todo-controller');

const router = Router();

router.use(authenticate);

router.get('/', todoController.getTodos);
router.post('/', validateBody(['title']), todoController.createTodo);
router.patch('/:id/toggle', todoController.toggleTodo);   // /:id 보다 먼저!
router.patch('/:id', todoController.updateTodo);
router.delete('/:id', todoController.deleteTodo);

module.exports = router;
