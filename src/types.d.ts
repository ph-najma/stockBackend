import "express"
declare global {
  namespace Express {
    interface User extends IUser {}
  }
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
