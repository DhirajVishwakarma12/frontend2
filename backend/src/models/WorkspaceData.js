import mongoose from "mongoose";

const currencySchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      maxlength: 3,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    inrValue: { type: String, default: "", maxlength: 40 },
  },
  { _id: false, strict: "throw" },
);

const itemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, maxlength: 80 },
    description: { type: String, default: "", maxlength: 240 },
    sac: { type: String, default: "", maxlength: 20 },
    rate: { type: String, default: "0", maxlength: 40 },
    gstRate: { type: String, default: "18", maxlength: 20 },
  },
  { _id: false, strict: "throw" },
);

const customerSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, maxlength: 80 },
    name: { type: String, default: "", maxlength: 200 },
    gstin: { type: String, default: "", maxlength: 20 },
    address: { type: String, default: "", maxlength: 1000 },
    email: { type: String, default: "", maxlength: 254 },
    phone: { type: String, default: "", maxlength: 40 },
  },
  { _id: false, strict: "throw" },
);

const placeSchema = new mongoose.Schema(
  {
    code: { type: String, default: "", maxlength: 2 },
    name: { type: String, default: "", maxlength: 120 },
  },
  { _id: false, strict: "throw" },
);

const workspaceDataSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    initialized: { type: Boolean, default: false, required: true },
    currencies: { type: [currencySchema], default: [] },
    rates: { type: [{ type: Number, min: 0, max: 100 }], default: [] },
    items: { type: [itemSchema], default: [] },
    customers: { type: [customerSchema], default: [] },
    places: { type: [placeSchema], default: [] },
  },
  { timestamps: true, versionKey: false, strict: "throw" },
);

const WorkspaceData =
  mongoose.models.WorkspaceData ||
  mongoose.model("WorkspaceData", workspaceDataSchema);
export default WorkspaceData;
