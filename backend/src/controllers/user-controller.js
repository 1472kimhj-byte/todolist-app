'use strict';

const userService = require('../services/user-service');

async function getMe(req, res, next) {
  try {
    const user = await userService.getMe(req.user.userId);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

async function updateMe(req, res, next) {
  try {
    const user = await userService.updateMe(req.user.userId, req.body);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

async function deleteMe(req, res, next) {
  try {
    await userService.deleteMe(req.user.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getMe, updateMe, deleteMe };
