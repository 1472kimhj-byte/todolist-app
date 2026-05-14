'use strict';

const AppError = require('../utils/app-error');

function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      console.error(`[Error] ${err.statusCode} ${err.code} - ${err.message}`);
    }
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    });
  }

  console.error(`[Error] 500 INTERNAL_SERVER_ERROR - ${err.message}`, err.stack);
  res.status(500).json({
    error: { code: 'INTERNAL_SERVER_ERROR', message: '서버 내부 오류가 발생했습니다.' },
  });
}

module.exports = errorHandler;
