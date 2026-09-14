import { AppService } from './app.service';

describe('AppService', () => {
  it('returns a healthy status', () => {
    const result = new AppService().getHealth();

    expect(result.status).toBe('ok');
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
  });
});
