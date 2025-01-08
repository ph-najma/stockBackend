export interface ILimitOrderQuery {
  orderType: string;
  status?: string | undefined;
  user?: { $regex: RegExp };
  createdAt?: { $gte: Date; $lte: Date };
}
