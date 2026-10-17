import { Document, Schema, Types, model } from "mongoose";
 
export interface IFavourite extends Document {
  customerId: Types.ObjectId;
  guesthouseId: Types.ObjectId;
  createdAt: Date;
}
 
const favouriteSchema = new Schema<IFavourite>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer ID is required."]
    },
    guesthouseId: {
      type: Schema.Types.ObjectId,
      ref: "Guesthouse",
      required: [true, "Guesthouse ID is required."]
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);
 
favouriteSchema.index({ customerId: 1, guesthouseId: 1 }, { unique: true });
 
const Favourite = model<IFavourite>("Favourite", favouriteSchema);
 
export default Favourite;
 