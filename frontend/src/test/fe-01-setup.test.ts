import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '../..');

describe('FE-01: 프로젝트 초기화 검증', () => {
  describe('필수 설정 파일', () => {
    it('vite.config.ts가 존재한다', () => {
      expect(existsSync(resolve(root, 'vite.config.ts'))).toBe(true);
    });

    it('tsconfig.json이 존재한다', () => {
      expect(existsSync(resolve(root, 'tsconfig.json'))).toBe(true);
    });

    it('tsconfig.app.json이 존재한다', () => {
      expect(existsSync(resolve(root, 'tsconfig.app.json'))).toBe(true);
    });

    it('.env.example이 존재한다', () => {
      expect(existsSync(resolve(root, '.env.example'))).toBe(true);
    });

    it('.gitignore가 존재한다', () => {
      expect(existsSync(resolve(root, '.gitignore'))).toBe(true);
    });
  });

  describe('.env.example 내용', () => {
    it('VITE_API_BASE_URL이 정의되어 있다', async () => {
      const { readFileSync } = await import('fs');
      const content = readFileSync(resolve(root, '.env.example'), 'utf-8');
      expect(content).toContain('VITE_API_BASE_URL=http://localhost:3000');
    });
  });

  describe('.gitignore 내용', () => {
    it('.env.local이 .gitignore에 포함되어 있다', async () => {
      const { readFileSync } = await import('fs');
      const content = readFileSync(resolve(root, '.gitignore'), 'utf-8');
      expect(content).toContain('.env.local');
    });
  });

  describe('src/ 디렉토리 구조', () => {
    it('src/app/ 디렉토리가 존재한다', () => {
      expect(existsSync(resolve(root, 'src/app'))).toBe(true);
    });

    it('src/features/auth/ 디렉토리가 존재한다', () => {
      expect(existsSync(resolve(root, 'src/features/auth'))).toBe(true);
    });

    it('src/features/category/ 디렉토리가 존재한다', () => {
      expect(existsSync(resolve(root, 'src/features/category'))).toBe(true);
    });

    it('src/features/todo/ 디렉토리가 존재한다', () => {
      expect(existsSync(resolve(root, 'src/features/todo'))).toBe(true);
    });

    it('src/shared/ 디렉토리가 존재한다', () => {
      expect(existsSync(resolve(root, 'src/shared'))).toBe(true);
    });
  });

  describe('tsconfig.app.json 설정', () => {
    it('strict 모드가 활성화되어 있다', async () => {
      const { readFileSync } = await import('fs');
      const content = JSON.parse(readFileSync(resolve(root, 'tsconfig.app.json'), 'utf-8'));
      expect(content.compilerOptions.strict).toBe(true);
    });

    it('@/* path alias가 설정되어 있다', async () => {
      const { readFileSync } = await import('fs');
      const content = JSON.parse(readFileSync(resolve(root, 'tsconfig.app.json'), 'utf-8'));
      expect(content.compilerOptions.paths?.['@/*']).toBeDefined();
      expect(content.compilerOptions.paths['@/*']).toContain('src/*');
    });
  });

  describe('package.json 의존성', () => {
    it('react@19가 설치 대상이다', async () => {
      const { readFileSync } = await import('fs');
      const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'));
      expect(pkg.dependencies.react).toMatch(/\^19/);
    });

    it('react-dom@19가 설치 대상이다', async () => {
      const { readFileSync } = await import('fs');
      const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'));
      expect(pkg.dependencies['react-dom']).toMatch(/\^19/);
    });

    it('zustand가 포함되어 있다', async () => {
      const { readFileSync } = await import('fs');
      const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'));
      expect(pkg.dependencies.zustand).toBeDefined();
    });

    it('@tanstack/react-query가 포함되어 있다', async () => {
      const { readFileSync } = await import('fs');
      const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'));
      expect(pkg.dependencies['@tanstack/react-query']).toBeDefined();
    });

    it('axios가 포함되어 있다', async () => {
      const { readFileSync } = await import('fs');
      const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'));
      expect(pkg.dependencies.axios).toBeDefined();
    });

    it('vitest가 devDependencies에 포함되어 있다', async () => {
      const { readFileSync } = await import('fs');
      const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'));
      expect(pkg.devDependencies.vitest).toBeDefined();
    });

    it('@testing-library/react가 devDependencies에 포함되어 있다', async () => {
      const { readFileSync } = await import('fs');
      const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'));
      expect(pkg.devDependencies['@testing-library/react']).toBeDefined();
    });

    it('jsdom이 devDependencies에 포함되어 있다', async () => {
      const { readFileSync } = await import('fs');
      const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'));
      expect(pkg.devDependencies.jsdom).toBeDefined();
    });
  });

  describe('vite.config.ts 설정', () => {
    it('vite.config.ts에 path alias 설정이 포함되어 있다', async () => {
      const { readFileSync } = await import('fs');
      const content = readFileSync(resolve(root, 'vite.config.ts'), 'utf-8');
      expect(content).toContain('@');
      expect(content).toContain('src');
    });

    it('vite.config.ts에 test environment jsdom이 설정되어 있다', async () => {
      const { readFileSync } = await import('fs');
      const content = readFileSync(resolve(root, 'vite.config.ts'), 'utf-8');
      expect(content).toContain('jsdom');
    });
  });
});
