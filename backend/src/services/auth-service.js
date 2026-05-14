'use strict';

const userRepo = require('../repositories/user-repository');
const refreshTokenRepo = require('../repositories/refresh-token-repository');
const { hashPassword, comparePassword } = require('../utils/hash-utils');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt-utils');
const AppError = require('../utils/app-error');

function getRefreshExpiry() {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);
  return expiry;
}

async function register(dto) {
  const { email, password, name } = dto;

  console.log(`[Auth] 회원가입 시도 - email: ${email}`);

  const existing = await userRepo.findByEmail(email);
  if (existing) {
    console.warn(`[Auth] 회원가입 실패 - 이미 존재하는 이메일: ${email}`);
    throw new AppError(409, 'EMAIL_ALREADY_EXISTS', '이미 사용 중인 이메일입니다.');
  }

  const passwordHash = await hashPassword(password);
  const user = await userRepo.create({ email, passwordHash, name });

  const payload = { userId: user.id, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await refreshTokenRepo.save(user.id, refreshToken, getRefreshExpiry());

  console.log(`[Auth] 회원가입 완료 - userId: ${user.id}, email: ${email}`);
  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.created_at },
  };
}

async function login(dto) {
  const { email, password } = dto;

  console.log(`[Auth] 로그인 시도 - email: ${email}`);

  const user = await userRepo.findByEmail(email);
  if (!user) {
    console.warn(`[Auth] 로그인 실패 - 존재하지 않는 이메일: ${email}`);
    throw new AppError(401, 'INVALID_CREDENTIALS', '이메일 또는 비밀번호가 올바르지 않습니다.');
  }

  const isValid = await comparePassword(password, user.password_hash);
  if (!isValid) {
    console.warn(`[Auth] 로그인 실패 - 비밀번호 불일치, userId: ${user.id}`);
    throw new AppError(401, 'INVALID_CREDENTIALS', '이메일 또는 비밀번호가 올바르지 않습니다.');
  }

  const payload = { userId: user.id, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await refreshTokenRepo.save(user.id, refreshToken, getRefreshExpiry());

  console.log(`[Auth] 로그인 성공 - userId: ${user.id}`);
  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name },
  };
}

async function logout(refreshToken) {
  await refreshTokenRepo.revokeByToken(refreshToken);
  console.log('[Auth] 로그아웃 처리 완료');
}

async function refreshTokens(refreshToken) {
  const tokenRecord = await refreshTokenRepo.findByToken(refreshToken);
  if (!tokenRecord) {
    console.warn('[Auth] 토큰 갱신 실패 - DB에서 토큰을 찾을 수 없음');
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', '유효하지 않거나 만료된 리프레시 토큰입니다.');
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    console.warn('[Auth] 토큰 갱신 실패 - 리프레시 토큰 검증 오류');
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', '유효하지 않거나 만료된 리프레시 토큰입니다.');
  }

  await refreshTokenRepo.revokeByToken(refreshToken);

  const newPayload = { userId: payload.userId, email: payload.email };
  const newAccessToken = signAccessToken(newPayload);
  const newRefreshToken = signRefreshToken(newPayload);

  await refreshTokenRepo.save(payload.userId, newRefreshToken, getRefreshExpiry());

  console.log(`[Auth] 토큰 갱신 완료 - userId: ${payload.userId}`);
  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

module.exports = { register, login, logout, refreshTokens };
