import { Schema, model, models, type InferSchemaType } from "mongoose";

const counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, required: true, default: 0 },
});

export type CounterDocument = InferSchemaType<typeof counterSchema>;
export const Counter = models.Counter || model("Counter", counterSchema);
