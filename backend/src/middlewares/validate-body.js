'use strict';

const AppError = require('../utils/app-error');

function validateBody(requiredFields) {
  return (req, res, next) => {
    const missingFields = requiredFields.filter((field) => {
      const value = req.body[field];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      return next(new AppError(400, 'VALIDATION_ERROR', `필수 필드가 누락되었습니다: ${missingFields.join(', ')}`));
    }

    next();
  };
}

module.exports = validateBody;
