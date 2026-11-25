import mongoose from "mongoose";
import Invoice from "../models/Invoice.js";

const FORM_FIELDS = [
  "proformaNo", "blNo", "customerName", "customerGstin", "customerAddress", "placeOfSupply", "placeOfSupplyCode",
  "bookingNo", "shipper", "portLoading", "portDischarge", "placeDelivery", "volume", "containerType", "containerNo",
  "vessel", "voyage", "sailing", "preparedBy", "remarks", "taxMode", "date", "ltDate",
];
const CHARGE_FIELDS = ["id", "description", "sac", "qty", "rate", "currency", "exchangeRate", "gstRate"];

function invalidRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function conflict(message) {
  const error = new Error(message);
  error.status = 409;
  return error;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function ensureInvoiceNumberIsAvailable(invoiceNumber, excludedInvoiceId) {
  const filter = {
    "form.proformaNo": { $regex: `^${escapeRegExp(invoiceNumber)}$`, $options: "i" },
  };
  if (excludedInvoiceId) filter._id = { $ne: excludedInvoiceId };
  if (await Invoice.exists(filter)) {
    throw conflict("This invoice number already exists. Open the existing invoice to update it.");
  }
}

function normalizeInvoiceData(body) {
  if (!body || !body.form || typeof body.form !== "object" || Array.isArray(body.form) || !Array.isArray(body.charges) || body.charges.length > 200) {
    throw invalidRequest("Invoice data must contain a form and up to 200 charge rows.");
  }
  const form = Object.fromEntries(FORM_FIELDS.map((field) => [field, String(body.form[field] ?? "").slice(0, 5000)]));
  form.proformaNo = form.proformaNo.trim();
  if (!form.proformaNo) throw invalidRequest("Invoice number is required.");
  form.taxMode = form.taxMode === "inter" ? "inter" : "intra";
  const charges = body.charges.map((charge) => {
    if (!charge || typeof charge !== "object" || Array.isArray(charge)) {
      throw invalidRequest("Each invoice charge must be an object.");
    }
    return Object.fromEntries(CHARGE_FIELDS.map((field) => [field, String(charge[field] ?? "").slice(0, field === "description" ? 500 : 100)]));
  });
  return { form, charges };
}

function serializeInvoice(invoice) {
  const record = invoice.toObject ? invoice.toObject() : invoice;
  return {
    id: String(record._id),
    form: record.form,
    charges: record.charges,
    owner: record.owner && record.owner._id
      ? { id: String(record.owner._id), email: record.owner.email }
      : { id: String(record.owner), email: "" },
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function listInvoices(request, response, next) {
  try {
    const filter = request.user.role === "admin" ? {} : { owner: request.user.id };
    const invoices = await Invoice.find(filter)
      .populate("owner", "email")
      .sort({ updatedAt: -1 })
      .lean();
    return response.json({ invoices: invoices.map(serializeInvoice) });
  } catch (error) {
    return next(error);
  }
}

export async function getInvoice(request, response, next) {
  try {
    const { invoiceId } = request.params;
    if (!mongoose.isValidObjectId(invoiceId)) return response.status(400).json({ message: "Invalid invoice ID." });
    const filter = request.user.role === "admin"
      ? { _id: invoiceId }
      : { _id: invoiceId, owner: request.user.id };
    const invoice = await Invoice.findOne(filter).populate("owner", "email").lean();
    if (!invoice) return response.status(404).json({ message: "Invoice not found." });
    return response.json({ invoice: serializeInvoice(invoice) });
  } catch (error) {
    return next(error);
  }
}

export async function createInvoice(request, response, next) {
  try {
    const data = normalizeInvoiceData(request.body);
    await ensureInvoiceNumberIsAvailable(data.form.proformaNo);
    const invoice = await Invoice.create({ ...data, owner: request.user.id });
    return response.status(201).json({ invoice: serializeInvoice(invoice) });
  } catch (error) {
    if (error.status) return response.status(error.status).json({ message: error.message });
    return next(error);
  }
}

export async function updateInvoice(request, response, next) {
  try {
    const { invoiceId } = request.params;
    if (!mongoose.isValidObjectId(invoiceId)) return response.status(400).json({ message: "Invalid invoice ID." });
    const data = normalizeInvoiceData(request.body);
    await ensureInvoiceNumberIsAvailable(data.form.proformaNo, invoiceId);
    const filter = request.user.role === "admin"
      ? { _id: invoiceId }
      : { _id: invoiceId, owner: request.user.id };
    const invoice = await Invoice.findOneAndUpdate(filter, { $set: data }, { new: true, runValidators: true })
      .populate("owner", "email");
    if (!invoice) return response.status(404).json({ message: "Invoice not found." });
    return response.json({ invoice: serializeInvoice(invoice) });
  } catch (error) {
    if (error.status) return response.status(error.status).json({ message: error.message });
    return next(error);
  }
}
