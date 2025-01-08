import Promotion from "../models/promoModel";

export interface IpromotionRepsoitory {
  createPromotion(data: any): Promise<any>;
  findPromotion(): Promise<any>;
}
export class PromotionRepository {
  async createPromotion(data: any): Promise<any> {
    const updatedPromotion = await Promotion.findOneAndUpdate(
      {},
      { $set: data },
      { new: true }
    );
    return updatedPromotion;
  }
  async findPromotion(): Promise<any> {
    return await Promotion.findOne();
  }
}
