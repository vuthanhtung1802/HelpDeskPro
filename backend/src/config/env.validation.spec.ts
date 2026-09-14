import 'reflect-metadata';
import { validateEnvironment } from './env.validation';

const validEnvironment = {
  NODE_ENV: 'test',
  PORT: '3000',
  FRONTEND_URL: 'http://localhost:3001',
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/helpdesk',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_SECRET: 'b'.repeat(32),
  JWT_REFRESH_EXPIRES_IN: '7d',
  COOKIE_SECURE: 'false',
  COOKIE_SAME_SITE: 'lax',
};

describe('validateEnvironment', () => {
  it('converts environment values to their runtime types', () => {
    const result = validateEnvironment(validEnvironment);

    expect(result.PORT).toBe(3000);
    expect(result.COOKIE_SECURE).toBe(false);
  });

  it('rejects short JWT secrets', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        JWT_ACCESS_SECRET: 'too-short',
      }),
    ).toThrow();
  });

  it('requires complete mail settings when SMTP is enabled', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        SMTP_ENABLED: 'true',
      }),
    ).toThrow();

    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        SMTP_ENABLED: 'true',
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '587',
        SMTP_SECURE: 'false',
        SMTP_USER: 'mailer',
        SMTP_PASSWORD: 'secret',
        MAIL_FROM: 'support@example.com',
        RESET_PASSWORD_URL: 'http://localhost:3001/reset-password',
      }),
    ).not.toThrow();
  });

  it('requires Cloudinary credentials when cloud attachment storage is selected', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        ATTACHMENT_STORAGE: 'cloudinary',
      }),
    ).toThrow();

    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        ATTACHMENT_STORAGE: 'cloudinary',
        CLOUDINARY_CLOUD_NAME: 'demo-cloud',
        CLOUDINARY_API_KEY: 'demo-key',
        CLOUDINARY_API_SECRET: 'demo-secret',
      }),
    ).not.toThrow();
  });
});
