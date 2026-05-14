import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatDate, formatRelativeTime } from './date-utils';

describe('formatDate()', () => {
  it('ISO 문자열을 한국어 날짜 형식으로 변환한다', () => {
    const result = formatDate('2026-05-14T00:00:00.000Z');
    expect(result).toContain('2026');
    expect(result).toContain('05');
    expect(result).toContain('14');
  });

  it('Date 객체를 받아 날짜 문자열로 변환한다', () => {
    const date = new Date('2026-01-15T00:00:00.000Z');
    const result = formatDate(date);
    expect(result).toContain('2026');
  });

  it('유효하지 않은 날짜는 빈 문자열을 반환한다', () => {
    expect(formatDate('invalid-date')).toBe('');
  });
});

describe('formatRelativeTime()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-14T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('오늘 날짜이면 "오늘"을 반환한다', () => {
    expect(formatRelativeTime('2026-05-14T06:00:00.000Z')).toBe('오늘');
  });

  it('어제 날짜이면 "어제"를 반환한다', () => {
    expect(formatRelativeTime('2026-05-13T12:00:00.000Z')).toBe('어제');
  });

  it('내일 날짜이면 "내일"을 반환한다', () => {
    expect(formatRelativeTime('2026-05-15T12:00:00.000Z')).toBe('내일');
  });

  it('2일 전은 "2일 전"을 반환한다', () => {
    expect(formatRelativeTime('2026-05-12T12:00:00.000Z')).toBe('2일 전');
  });

  it('3일 후는 "3일 후"를 반환한다', () => {
    expect(formatRelativeTime('2026-05-17T12:00:00.000Z')).toBe('3일 후');
  });

  it('유효하지 않은 날짜는 빈 문자열을 반환한다', () => {
    expect(formatRelativeTime('invalid')).toBe('');
  });
});
