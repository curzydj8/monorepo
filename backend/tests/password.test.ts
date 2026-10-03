import { describe, expect, it } from 'vitest';
import bcrypt from 'bcryptjs';

describe('bcrypt 密码哈希', () => {
  it('hash 后 compare 验证通过', async () => {
    const hash = await bcrypt.hash('password123', 10);
    expect(await bcrypt.compare('password123', hash)).toBe(true);
  });

  it('错误密码 compare 验证失败', async () => {
    const hash = await bcrypt.hash('password123', 10);
    expect(await bcrypt.compare('wrong-password', hash)).toBe(false);
  });

  it('哈希值不等于明文，且每次加盐结果不同', async () => {
    const hash1 = await bcrypt.hash('password123', 10);
    const hash2 = await bcrypt.hash('password123', 10);
    expect(hash1).not.toBe('password123');
    expect(hash1).not.toBe(hash2);
  });
});
