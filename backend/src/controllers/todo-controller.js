'use strict';

const todoService = require('../services/todo-service');

async function getTodos(req, res, next) {
  try {
    const todos = await todoService.getTodos(req.user.userId, req.query);
    res.status(200).json({ todos });
  } catch (err) {
    next(err);
  }
}

async function createTodo(req, res, next) {
  try {
    const todo = await todoService.createTodo(req.user.userId, req.body);
    res.status(201).json({ todo });
  } catch (err) {
    next(err);
  }
}

async function updateTodo(req, res, next) {
  try {
    const todo = await todoService.updateTodo(req.user.userId, req.params.id, req.body);
    res.status(200).json({ todo });
  } catch (err) {
    next(err);
  }
}

async function toggleTodo(req, res, next) {
  try {
    const todo = await todoService.toggleTodo(req.user.userId, req.params.id);
    res.status(200).json({ todo });
  } catch (err) {
    next(err);
  }
}

async function deleteTodo(req, res, next) {
  try {
    await todoService.deleteTodo(req.user.userId, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getTodos, createTodo, updateTodo, toggleTodo, deleteTodo };
