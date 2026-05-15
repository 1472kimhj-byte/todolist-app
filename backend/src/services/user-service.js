'use strict';

const { getClient } = require('../config/db');
const userRepo = require('../repositories/user-repository');
const refreshTokenRepo = require('../repositories/refresh-token-repository');
const { hashPassword, comparePassword } = require('../utils/hash-utils');
const AppError = require('../utils/app-error');

function omitPasswordHash(user) {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  return rest;
}

async function getMe(userId) {
  const user = await userRepo.findById(userId);
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', '사용자를 찾을 수 없습니다.');
  return omitPasswordHash(user);
}

async function updateMe(userId, dto) {
  // dto: { name?, currentPassword?, password? }
  const user = await userRepo.findById(userId);
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', '사용자를 찾을 수 없습니다.');

  const fields = {};

  if (dto.name !== undefined) {
    fields.name = dto.name;
  }

  if (dto.password !== undefined) {
    if (!dto.currentPassword) {
      throw new AppError(400, 'VALIDATION_ERROR', '현재 비밀번호를 입력해주세요.');
    }
    const isValid = await comparePassword(dto.currentPassword, user.password_hash);
    if (!isValid) {
      console.warn(`[User] 비밀번호 변경 실패 - 현재 비밀번호 불일치, userId: ${userId}`);
      throw new AppError(401, 'WRONG_PASSWORD', '현재 비밀번호가 올바르지 않습니다.');
    }
    fields.password_hash = await hashPassword(dto.password);
    console.log(`[User] 비밀번호 변경 - userId: ${userId}`);
  }

  if (Object.keys(fields).length === 0) {
    return omitPasswordHash(user);
  }

  const updated = await userRepo.updateById(userId, fields);
  console.log(`[User] 프로필 업데이트 완료 - userId: ${userId}, 변경 필드: ${Object.keys(fields).join(', ')}`);
  return omitPasswordHash(updated);
}

async function deleteMe(userId, password) {
  if (!password) {
    throw new AppError(400, 'VALIDATION_ERROR', '비밀번호를 입력해주세요.');
  }

  const user = await userRepo.findById(userId);
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', '사용자를 찾을 수 없습니다.');

  const isValid = await comparePassword(password, user.password_hash);
  if (!isValid) {
    throw new AppError(401, 'WRONG_PASSWORD', '비밀번호가 올바르지 않습니다.');
  }

  console.log(`[User] 회원 탈퇴 시작 - userId: ${userId}`);
  const client = await getClient();
  try {
    await client.query('BEGIN');
    await client.query(
      'UPDATE refresh_tokens SET revoked = true WHERE user_id = $1',
      [userId]
    );
    await client.query('DELETE FROM users WHERE id = $1', [userId]);
    await client.query('COMMIT');
    console.log(`[User] 회원 탈퇴 완료 - userId: ${userId}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`[User] 회원 탈퇴 롤백 - userId: ${userId}, 오류: ${err.message}`);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { getMe, updateMe, deleteMe };
