'use strict';

const AppError = require('../utils/app-error');
const { verifyAccessToken } = require('../utils/jwt-utils');

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError(401, 'UNAUTHORIZED', '인증이 필요합니다.'));
  }

  const token = authHeader.slice(7);

  try {
    const decoded = verifyAccessToken(token);
    req.user = { userId: decoded.userId, email: decoded.email };
    console.log(`[Auth] 토큰 인증 성공 - userId: ${decoded.userId}`);
    next();
  } catch (err) {
    console.warn(`[Auth] 토큰 인증 실패 - ${err.message}`);
    next(new AppError(401, 'UNAUTHORIZED', '유효하지 않거나 만료된 토큰입니다.'));
  }
}

module.exports = authenticate;
