import { config } from '../config/config.js';

describe('Configuration', () => {
  test('should load configuration successfully', () => {
    expect(config).toBeDefined();
    expect(config.mongodbUri).toBeDefined();
    expect(config.nodeEnv).toBeDefined();
  });

  test('should have valid environment', () => {
    expect(['development', 'production', 'test']).toContain(config.nodeEnv);
  });
});