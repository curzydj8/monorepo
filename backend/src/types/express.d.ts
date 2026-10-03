declare global {
  namespace Express {
    /** 经 requireAuth 中间件认证后挂载的用户信息。 */
    interface RequestUser {
      id: string;
      email: string;
    }

    interface Request {
      user?: RequestUser;
    }
  }
}

export {};
