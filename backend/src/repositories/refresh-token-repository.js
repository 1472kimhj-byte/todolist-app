'use strict';

const crypto = require('crypto');
const { query } = require('../config/db');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function save(userId, token, expiresAt) {
  const tokenHash = hashToken(token);
  const result = await query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3) RETURNING *',
    [userId, tokenHash, expiresAt]
  );
  return result.rows[0];
}

async function findByToken(token) {
  const tokenHash = hashToken(token);
  const result = await query(
    'SELECT * FROM refresh_tokens WHERE token_hash = $1 AND revoked = false AND expires_at > now()',
    [tokenHash]
  );
  return result.rows[0] || null;
}

async function revokeByToken(token) {
  const tokenHash = hashToken(token);
  await query(
    'UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1',
    [tokenHash]
  );
}

async function revokeByUserId(userId) {
  await query(
    'UPDATE refresh_tokens SET revoked = true WHERE user_id = $1',
    [userId]
  );
}

module.exports = { save, findByToken, revokeByToken, revokeByUserId };
