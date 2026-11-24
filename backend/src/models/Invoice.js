import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  form: { type: mongoose.Schema.Types.Mixed, required: true },
  charges: { type: [mongoose.Schema.Types.Mixed], default: [] },
}, { timestamps: true, versionKey: false, strict: "throw" });

invoiceSchema.index({ updatedAt: -1 });

const Invoice = mongoose.models.Invoice || mongoose.model("Invoice", invoiceSchema);
export default Invoice;
