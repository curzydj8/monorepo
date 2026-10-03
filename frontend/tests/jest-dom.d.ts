/**
 * jest-dom 类型补充：
 * 本仓库 frontend 解析到的 vitest@2 与根目录的 @testing-library/jest-dom
 * 对 'vitest' 模块的增强目标不一致（jest-dom 增强的是根目录 vitest@3），
 * 因此在这里直接对实际使用的 '@vitest/expect' 模块做接口合并。
 */
import type * as matchersNS from '@testing-library/jest-dom/matchers';

type TLM<E, R> = matchersNS.TestingLibraryMatchers<E, R>;

declare module '@vitest/expect' {
  interface Assertion<T = unknown> extends TLM<unknown, T> {}
  interface AsymmetricMatchersContaining extends TLM<unknown, unknown> {}
}
