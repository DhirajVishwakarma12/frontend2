import WorkspaceData from "../models/WorkspaceData.js";

const PARTY_FIELDS = ["id", "name", "gstin", "address", "email", "phone"];
const COLLECTION_KEYS = ["currencies", "rates", "items", "customers", "buyers", "places"];
const FIELD_KEYS = {
  currencies: ["code", "name", "inrValue"],
  items: ["id", "description", "sac", "rate", "gstRate"],
  customers: PARTY_FIELDS,
  buyers: PARTY_FIELDS,
  places: ["code", "name"],
};

function toWorkspaceResponse(document) {
  return {
    initialized: Boolean(document?.initialized),
    currencies: document?.currencies || [],
    rates: document?.rates || [],
    items: document?.items || [],
    customers: document?.customers || [],
    buyers: document?.buyers || [],
    places: document?.places || [],
  };
}

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function normalizePayload(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw badRequest("Workspace data must be an object.");
  }

  for (const key of COLLECTION_KEYS) {
    if (!Array.isArray(body[key]) || body[key].length > 1000) {
      throw badRequest(`Workspace ${key} must be an array of up to 1000 entries.`);
    }
  }

  const normalized = {};
  for (const key of ["currencies", "items", "customers", "buyers", "places"]) {
    normalized[key] = body[key].map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        throw badRequest(`Each ${key} entry must be an object.`);
      }
      return Object.fromEntries(FIELD_KEYS[key].map((field) => {
        const value = entry[field];
        return [field, value == null ? "" : String(value)];
      }));
    });
  }

  normalized.rates = body.rates.map((rate) => {
    const numericRate = Number(rate);
    if (!Number.isFinite(numericRate) || numericRate < 0 || numericRate > 100) {
      throw badRequest("Each GST rate must be a number from 0 to 100.");
    }
    return numericRate;
  });

  if (normalized.currencies.some(({ code }) => !/^[A-Z]{3}$/.test(code))) {
    throw badRequest("Currency codes must contain three letters.");
  }
  if (normalized.currencies.some(({ inrValue }) => inrValue && (!Number.isFinite(Number(inrValue)) || Number(inrValue) <= 0))) {
    throw badRequest("Currency INR values must be greater than zero.");
  }
  if (normalized.currencies.filter(({ code }) => code === "INR").length > 1) {
    throw badRequest("INR can only be listed once.");
  }
  if (normalized.rates.some((rate, index) => normalized.rates.indexOf(rate) !== index)) {
    throw badRequest("GST rates must be unique.");
  }
  return normalized;
}

export async function getWorkspaceData(request, response, next) {
  try {
    const document = await WorkspaceData.findOne({ owner: request.user.id }).lean();
    return response.json(toWorkspaceResponse(document));
  } catch (error) {
    return next(error);
  }
}

export async function saveWorkspaceData(request, response, next) {
  try {
    const payload = normalizePayload(request.body);
    const document = await WorkspaceData.findOneAndUpdate(
      { owner: request.user.id },
      { $set: { ...payload, initialized: true } },
      { returnDocument: "after", upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).lean();
    return response.json(toWorkspaceResponse(document));
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") error.status = 400;
    return next(error);
  }
}
