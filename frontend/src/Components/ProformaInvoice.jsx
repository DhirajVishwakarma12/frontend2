import React, { useEffect, useMemo, useRef, useState } from "react";
import "../Style/bill.css";
import PreviewPage from "./previwpage.jsx";
import CurrencyPage from "../pages/currency.jsx";
import RatePage from "../pages/RatePage.jsx";
import ItemsPage from "../pages/ItemsPage.jsx";
import PlaceOfSupplyPage, { STATES } from "../pages/PlaceOfSupplyPage.jsx";
import CustomersPage from "../pages/CustomersPage.jsx";
import { loadWorkspaceData, saveWorkspaceData } from "../services/workspaceData.js";
import { createInvoice, getInvoice, getInvoices, saveInvoice } from "../services/invoices.js";

const COMPANY = {
  name: "WHITE STAR SHIPPING PRIVATE LIMITED",
  address: [
    "3rd Floor Office No: A 312, Kukreja Plaza Plot 46",
    "Sector -11, CBD Belapur Navi Mumbai-400614",
  ],
  contact: "UDYAM-MH-33-0595826  ·  GSTIN : 27AADCV4578P1ZF  ·  PAN: AADCV4578P",
  gstin: "27AADCV4578P1ZF",
  stateCode: "27",
  bank: {
    beneficiary: "WHITE STAR SHIPPING PRIVATE LIMITED",
    name: "HDFC BANK CBD Belapur",
    account: "99999833560055",
    ifsc: "HDFC0002860",
  },
};

const getCurrentDate = () => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
};

const INITIAL_FORM = {
  proformaNo: "",
  blNo: "",
  customerName: "",
  customerGstin: "",
  customerAddress: "",
  placeOfSupply: "",
  placeOfSupplyCode: "",
  bookingNo: "",
  shipper: "",
  portLoading: "",
  portDischarge: "",
  placeDelivery: "",
  volume: "",
  containerType: "",
  containerNo: "",
  vessel: "",
  voyage: "",
  sailing: "",
  preparedBy: "",
  remarks: "",
  taxMode: "intra",
};

const createInitialForm = () => {
  const today = getCurrentDate();
  return {
    ...INITIAL_FORM,
    proformaNo: "WS/PI/2026/001",
    customerName: INITIAL_CUSTOMERS[0].name,
    customerGstin: INITIAL_CUSTOMERS[0].gstin,
    customerAddress: INITIAL_CUSTOMERS[0].address,
    placeOfSupply: "Maharashtra",
    placeOfSupplyCode: "27",
    blNo: "MAEU123456789",
    bookingNo: "WSB-2026-001",
    shipper: "ACME EXPORTS PRIVATE LIMITED",
    portLoading: "NHAVA SHEVA, INDIA",
    portDischarge: "JEBEL ALI, UAE",
    placeDelivery: "DUBAI, UAE",
    volume: "1",
    containerType: "20 FT",
    containerNo: "MSCU1234567",
    vessel: "MSC EXAMPLE",
    voyage: "V. 026E",
    sailing: today,
    preparedBy: "Sales Team",
    remarks: "Demo invoice — sample data for preview. Please replace before use.",
    date: today,
    ltDate: today,
  };
};

const createNewInvoiceForm = () => {
  const today = getCurrentDate();
  return {
    ...INITIAL_FORM,
    date: today,
    ltDate: today,
    sailing: today,
  };
};

const createEmptyCharge = () => [{
  id: Date.now(),
  description: "",
  sac: "",
  qty: "1",
  rate: "0",
  currency: "INR",
  exchangeRate: "1",
  gstRate: "18",
}];

const INITIAL_CHARGES = [
  { id: 1, description: "TERMINAL HANDLING CHARGES", sac: "996711", qty: "1", rate: "20500", currency: "INR", exchangeRate: "1", gstRate: "18" },
  { id: 2, description: "DOCUMENTATION CHARGES", sac: "996799", qty: "1", rate: "4000", currency: "INR", exchangeRate: "1", gstRate: "18" },
  { id: 3, description: "SEAL CHARGES", sac: "996799", qty: "1", rate: "850", currency: "INR", exchangeRate: "1", gstRate: "18" },
  { id: 4, description: "TOLL CHARGES", sac: "996799", qty: "1", rate: "1200", currency: "INR", exchangeRate: "1", gstRate: "18" },
  { id: 5, description: "MUC CHARGES", sac: "996799", qty: "1", rate: "200", currency: "INR", exchangeRate: "1", gstRate: "18" },
  { id: 6, description: "SEAWAY BL CHARGES", sac: "996799", qty: "1", rate: "1500", currency: "INR", exchangeRate: "1", gstRate: "18" },
];

const createInitialCharges = () => INITIAL_CHARGES.map((charge, index) => ({
  ...charge,
  id: Date.now() + index,
}));

const CURRENCY_STORAGE_KEY = "white-star-currency-rates";
const DEFAULT_CURRENCIES = [
  { code: "INR", name: "Indian Rupee", inrValue: "1" },
  { code: "USD", name: "US Dollar", inrValue: "" },
  { code: "AED", name: "UAE Dirham", inrValue: "" },
];
const GST_RATE_STORAGE_KEY = "white-star-gst-rates";
const ITEMS_STORAGE_KEY = "white-star-items";
const PLACES_STORAGE_KEY = "white-star-places";
const CUSTOMERS_STORAGE_KEY = "white-star-customers";
const INITIAL_CUSTOMERS = [{
  id: 1,
  name: "IET LOGISTICS PRIVATE LIMITED",
  gstin: "27AAHCI3210J1ZQ",
  address: "FIRST FLOOR, FLAT NO 101 PLOT NO 131 T.P.S. III, AMAR 1 CHS LTD.\nFACTORY LANE, NEAR M K COLLEGE, BORIVALI WEST,\nMUMBAI, MUMBAI SUBURBAN, MAHARASHTRA, 400092",
  email: "",
  phone: "",
}];
const INITIAL_ITEMS = INITIAL_CHARGES.map(({ id, description, sac, rate, gstRate }) => ({
  id, description, sac, rate, gstRate,
}));
const WORKSPACE_PAGES = [
  { id: "invoice", label: "Invoice" },
  { id: "currencies", label: "Currencies" },
  { id: "rates", label: "Rates" },
  { id: "items", label: "Items" },
  { id: "customers", label: "Customers" },
  { id: "place-of-supply", label: "Place of Supply" },
];

function accountStorageKey(key, userId) {
  return userId ? `${key}:${userId}` : key;
}

function loadCurrencySettings(userId, allowLegacyData) {
  try {
    const accountKey = accountStorageKey(CURRENCY_STORAGE_KEY, userId);
    const savedValue = window.localStorage.getItem(accountKey)
      ?? (allowLegacyData ? window.localStorage.getItem(CURRENCY_STORAGE_KEY) : null);
    const saved = JSON.parse(savedValue);
    if (!Array.isArray(saved)) return DEFAULT_CURRENCIES;
    if (saved.every((currency) => typeof currency === "string")) {
      return saved.map((code) => DEFAULT_CURRENCIES.find((currency) => currency.code === code) || { code, name: code, inrValue: "" });
    }
    return saved;
  } catch {
    return DEFAULT_CURRENCIES;
  }
}
const DEFAULT_GST_RATES = [0, 5, 12, 18, 28];
function loadStoredList(key, fallback, userId, allowLegacyData) {
  try {
    const accountKey = accountStorageKey(key, userId);
    const savedValue = window.localStorage.getItem(accountKey)
      ?? (allowLegacyData ? window.localStorage.getItem(key) : null);
    const saved = JSON.parse(savedValue);
    return Array.isArray(saved) ? saved : fallback;
  } catch {
    return fallback;
  }
}
function loadCustomers(userId, allowLegacyData) {
  const demoSeedKey = "white-star-demo-customer-seeded";
  try {
    const accountDataKey = accountStorageKey(CUSTOMERS_STORAGE_KEY, userId);
    const accountSeedKey = accountStorageKey(demoSeedKey, userId);
    const savedValue = window.localStorage.getItem(accountDataKey)
      ?? (allowLegacyData ? window.localStorage.getItem(CUSTOMERS_STORAGE_KEY) : null);
    const saved = JSON.parse(savedValue);
    const savedSeedValue = window.localStorage.getItem(accountSeedKey)
      ?? (allowLegacyData ? window.localStorage.getItem(demoSeedKey) : null);
    const demoSeeded = savedSeedValue === "true";
    window.localStorage.setItem(accountSeedKey, "true");
    if (!Array.isArray(saved) || (saved.length === 0 && !demoSeeded)) return INITIAL_CUSTOMERS;
    return saved.map((customer) => ({
      ...customer,
      phone: String(customer.phone || "").replace(/\D/g, "") === "07039640900" ? "" : customer.phone || "",
    }));
  } catch {
    return INITIAL_CUSTOMERS;
  }
}
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const SAC_REGEX = /^[0-9]{6}$/;
const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const money = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const dateForPrint = (value) => {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
};

function numberToWordsUnderThousand(number) {
  const ones = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE"];
  const teens = ["TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
  const tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];
  let n = Math.floor(number);
  const words = [];
  if (n >= 100) {
    words.push(`${ones[Math.floor(n / 100)]} HUNDRED`);
    n %= 100;
  }
  if (n >= 10 && n <= 19) words.push(teens[n - 10]);
  else {
    if (n >= 20) words.push(tens[Math.floor(n / 10)]);
    if (n % 10) words.push(ones[n % 10]);
  }
  return words.join(" ");
}

function amountInWords(amount) {
  const totalPaise = Math.round((Number(amount) + Number.EPSILON) * 100);
  const rupees = Math.floor(totalPaise / 100);
  const paise = totalPaise % 100;
  if (rupees === 0 && paise === 0) return "ZERO RUPEES ONLY";

  let n = rupees;
  const groups = [
    [10000000, "CRORE"],
    [100000, "LAKH"],
    [1000, "THOUSAND"],
    [100, "HUNDRED"],
  ];
  const words = [];
  groups.forEach(([value, label]) => {
    if (n >= value) {
      const count = Math.floor(n / value);
      words.push(`${numberToWordsUnderThousand(count)} ${label}`);
      n %= value;
    }
  });
  if (n) words.push(numberToWordsUnderThousand(n));
  let result = `RUPEES ${words.join(" ")}`;
  if (paise) result += ` AND ${numberToWordsUnderThousand(paise)} PAISE`;
  return `${result} ONLY`;
}

export default function ProformaInvoice({ mode = "view", onHome, onLogout, user, invoiceId }) {
  const allowLegacyData = user?.role === "admin";
  const [form, setForm] = useState(() => mode === "create" ? createNewInvoiceForm() : createInitialForm());
  const [charges, setCharges] = useState(() => mode === "create" ? createEmptyCharge() : createInitialCharges());
  const pendingDescriptionFocus = useRef(null);
  const [page, setPage] = useState("invoice");
  const [activeInvoiceId, setActiveInvoiceId] = useState(invoiceId || null);
  const [invoiceReady, setInvoiceReady] = useState(false);
  const [invoiceSaveError, setInvoiceSaveError] = useState("");
  const [workspaceDataReady, setWorkspaceDataReady] = useState(false);
  const [currencySettings, setCurrencySettings] = useState(() => loadCurrencySettings(user?.id, allowLegacyData));
  const currencies = currencySettings.map((currency) => currency.code);
  const [gstRates, setGstRates] = useState(() => loadStoredList(GST_RATE_STORAGE_KEY, DEFAULT_GST_RATES, user?.id, allowLegacyData));
  const [items, setItems] = useState(() => loadStoredList(ITEMS_STORAGE_KEY, INITIAL_ITEMS, user?.id, allowLegacyData).map((item) => ({
    ...item,
    rate: String(item.rate ?? "0"),
    gstRate: String(item.gstRate ?? "18"),
  })));
  const [places, setPlaces] = useState(() => loadStoredList(PLACES_STORAGE_KEY, STATES, user?.id, allowLegacyData));
  const [customers, setCustomers] = useState(() => loadCustomers(user?.id, allowLegacyData));
  const [errors, setErrors] = useState({});

  const handlePageSelection = async (value) => {
    if (value !== "logout") {
      setPage(value);
      return;
    }
    try {
      if (invoiceReady) {
        try {
          await saveInvoice(activeInvoiceId, { form, charges });
        } catch (error) {
          console.error("Final invoice save failed before logout.", error);
        }
      }
      await onLogout?.();
    } catch (error) {
      console.error("Could not log out.", error);
      window.alert(error.message || "Could not log out. Please try again.");
    }
  };

  useEffect(() => {
    let active = true;
    const hydrate = (invoice) => {
      if (!active) return;
      setForm(invoice.form);
      setCharges(invoice.charges);
      setActiveInvoiceId(invoice.id);
      setInvoiceReady(true);
    };

    if (invoiceId) {
      getInvoice(invoiceId).then(({ invoice }) => hydrate(invoice)).catch((error) => {
        console.error("Invoice could not be loaded.", error);
      });
    } else if (mode === "view") {
      getInvoices().then(({ invoices: savedInvoices }) => {
        if (savedInvoices.length) hydrate(savedInvoices[0]);
        else if (active) setInvoiceReady(true);
      }).catch((error) => {
        console.error("Invoices could not be loaded.", error);
      });
    } else {
      createInvoice({ form, charges })
        .then(({ invoice }) => {
          if (!active) return;
          setActiveInvoiceId(invoice.id);
          setInvoiceReady(true);
        })
        .catch((error) => {
          if (active) setInvoiceSaveError(`Invoice could not be created: ${error.message}`);
        });
    }
    return () => { active = false; };
  }, [invoiceId, mode]);

  useEffect(() => {
    if (!invoiceReady) return undefined;
    const data = { form, charges };
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const result = await saveInvoice(activeInvoiceId, data);
        if (active) {
          setInvoiceSaveError("");
          if (!activeInvoiceId) setActiveInvoiceId(result.invoice.id);
        }
      } catch (error) {
        console.error("Invoice could not be saved.", error);
        if (active) setInvoiceSaveError(`Invoice could not be saved: ${error.message}`);
      }
    }, 700);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [invoiceReady, activeInvoiceId, form, charges]);

  useEffect(() => {
    let active = true;
    loadWorkspaceData()
      .then((data) => {
        if (!active) return;
        if (data.initialized) {
          setCurrencySettings(data.currencies);
          setGstRates(data.rates);
          setItems(data.items.map((item) => ({ ...item, id: String(item.id) })));
          setCustomers(data.customers.map((customer) => ({ ...customer, id: String(customer.id) })));
          setPlaces(data.places);
        }
        setWorkspaceDataReady(true);
      })
      .catch((error) => {
        if (!active) return;
        console.error("Workspace data could not be loaded.", error);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!workspaceDataReady) return undefined;
    const data = {
      currencies: currencySettings,
      rates: gstRates,
      items: items.map((item) => ({ ...item, id: String(item.id) })),
      customers: customers.map((customer) => ({ ...customer, id: String(customer.id) })),
      places,
    };
    const saveTimer = window.setTimeout(() => {
      saveWorkspaceData(data)
        .catch((error) => console.error("Workspace data could not be saved.", error));
    }, 350);
    return () => window.clearTimeout(saveTimer);
  }, [workspaceDataReady, currencySettings, gstRates, items, customers, places]);

  useEffect(() => {
    window.localStorage.setItem(accountStorageKey(CURRENCY_STORAGE_KEY, user?.id), JSON.stringify(currencySettings));
    setCharges((current) => current.map((charge) => {
      if (charge.currency === "INR") return charge.exchangeRate === "1" ? charge : { ...charge, exchangeRate: "1" };
      const configuredRate = currencySettings.find((currency) => currency.code === charge.currency)?.inrValue || "";
      return charge.exchangeRate === configuredRate ? charge : { ...charge, exchangeRate: configuredRate };
    }));
  }, [currencySettings, user?.id]);

  useEffect(() => {
    window.localStorage.setItem(accountStorageKey(GST_RATE_STORAGE_KEY, user?.id), JSON.stringify(gstRates));
  }, [gstRates, user?.id]);

  useEffect(() => {
    window.localStorage.setItem(accountStorageKey(ITEMS_STORAGE_KEY, user?.id), JSON.stringify(items));
  }, [items, user?.id]);

  useEffect(() => {
    window.localStorage.setItem(accountStorageKey(PLACES_STORAGE_KEY, user?.id), JSON.stringify(places));
  }, [places, user?.id]);

  useEffect(() => {
    window.localStorage.setItem(accountStorageKey(CUSTOMERS_STORAGE_KEY, user?.id), JSON.stringify(customers));
  }, [customers, user?.id]);

  const saveWorkspaceDataNow = () => saveWorkspaceData({
    currencies: currencySettings,
    rates: gstRates,
    items: items.map((item) => ({ ...item, id: String(item.id) })),
    customers: customers.map((customer) => ({ ...customer, id: String(customer.id) })),
    places,
  });

  const useCustomer = (customer) => {
    setForm((current) => ({
      ...current,
      customerName: customer.name,
      customerGstin: customer.gstin || "",
      customerAddress: customer.address || "",
    }));
    setErrors((current) => ({
      ...current,
      customerName: "",
      customerGstin: "",
      customerAddress: "",
    }));
    setPage("invoice");
  };

  useEffect(() => {
    if (pendingDescriptionFocus.current === null) return;
    document.getElementById(`charge-description-${pendingDescriptionFocus.current}`)?.focus();
    pendingDescriptionFocus.current = null;
  }, [charges]);

  const updateField = (field) => (value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const updateCharge = (id, field, value) => {
    setCharges((current) => current.map((charge) =>
      charge.id === id ? { ...charge, [field]: value } : charge
    ));
    setErrors((current) => ({ ...current, [`charge-${id}-${field}`]: "" }));
  };

  const updateChargeCurrency = (id, currency) => {
    const configuredRate = currency === "INR"
      ? "1"
      : currencySettings.find((item) => item.code === currency)?.inrValue || "";
    setCharges((current) => current.map((charge) =>
      charge.id === id
        ? { ...charge, currency, exchangeRate: configuredRate }
        : charge
    ));
    setErrors((current) => ({
      ...current,
      [`charge-${id}-currency`]: "",
      [`charge-${id}-exchangeRate`]: "",
    }));
  };

  const updatePlaceOfSupply = (code) => {
    const state = places.find((item) => item.code === code);
    setForm((current) => ({
      ...current,
      placeOfSupplyCode: code,
      placeOfSupply: state?.name || "",
    }));
    setErrors((current) => ({ ...current, placeOfSupplyCode: "" }));
  };

  const applyCatalogItem = (chargeId, item) => {
    const gstRateValue = [item.gstRate, item.taxRate, item.gst]
      .find((value) => value !== undefined && value !== null && String(value).trim() !== "");
    const rawGstRate = Number(gstRateValue);
    const gstRate = gstRateValue !== undefined && Number.isFinite(rawGstRate) && rawGstRate >= 0 && rawGstRate <= 100
      ? String(rawGstRate)
      : "18";
    setCharges((current) => current.map((charge) => charge.id === chargeId ? {
      ...charge,
      description: item.description,
      sac: item.sac,
      rate: item.rate,
      gstRate,
    } : charge));
    setErrors((current) => {
      const next = { ...current };
      ["description", "sac", "rate", "gstRate"].forEach((field) => delete next[`charge-${chargeId}-${field}`]);
      return next;
    });
  };

  const addCharge = () => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    pendingDescriptionFocus.current = id;
    setCharges((current) => [...current, {
      id,
      description: "",
      sac: "",
      qty: "1",
      rate: "0",
      currency: "INR",
      exchangeRate: "1",
      gstRate: "18",
    }]);
  };

  const removeCharge = (id) => {
    if (charges.length <= 1) return;
    setCharges((current) => current.filter((charge) => charge.id !== id));
    if (pendingDescriptionFocus.current === id) pendingDescriptionFocus.current = null;
    setErrors((current) => Object.fromEntries(
      Object.entries(current).filter(([field]) => !field.startsWith(`charge-${id}-`))
    ));
  };

  const calculatedCharges = useMemo(() => charges.map((charge) => {
    const qty = Number(charge.qty) || 0;
    const rate = Number(charge.rate) || 0;
    const exchangeRate = Number(charge.exchangeRate) || 0;
    const gstRate = Number(charge.gstRate) || 0;
    const amount = round2(round2(qty * rate) * exchangeRate);
    const tax = round2(amount * gstRate / 100);
    const cgst = form.taxMode === "intra" ? round2(tax / 2) : 0;
    const sgst = form.taxMode === "intra" ? round2(tax - cgst) : 0;
    const igst = form.taxMode === "inter" ? tax : 0;
    return { ...charge, qty, rate, rateText: charge.rate, exchangeRate, gstRate, amount, cgst, sgst, igst, total: round2(amount + cgst + sgst + igst) };
  }), [charges, form.taxMode]);

  const totals = useMemo(() => calculatedCharges.reduce((acc, row) => ({
    taxable: round2(acc.taxable + row.amount),
    cgst: round2(acc.cgst + row.cgst),
    sgst: round2(acc.sgst + row.sgst),
    igst: round2(acc.igst + row.igst),
    total: round2(acc.total + row.total),
  }), { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 }), [calculatedCharges]);

  const taxSummary = useMemo(() => {
    const grouped = new Map();
    calculatedCharges.filter((row, index) => !(index === calculatedCharges.length - 1
      && !row.description.trim()
      && !row.sac.trim()
      && (!String(row.rateText).trim() || Number(row.rateText) === 0))).forEach((row) => {
      const key = `${row.sac}-${row.gstRate}`;
      const existing = grouped.get(key) || { sac: row.sac, gstRate: row.gstRate, taxable: 0, cgst: 0, sgst: 0, igst: 0, tax: 0 };
      existing.taxable = round2(existing.taxable + row.amount);
      existing.cgst = round2(existing.cgst + row.cgst);
      existing.sgst = round2(existing.sgst + row.sgst);
      existing.igst = round2(existing.igst + row.igst);
      existing.tax = round2(existing.tax + row.cgst + row.sgst + row.igst);
      grouped.set(key, existing);
    });
    return [...grouped.values()];
  }, [calculatedCharges]);

  const validate = () => {
    const next = {};
    if (!form.proformaNo.trim()) next.proformaNo = "Invoice number is required.";
    if (!form.date) next.date = "Invoice date is required.";
    if (!form.customerName.trim()) next.customerName = "Customer name is required.";
    if (!form.customerAddress.trim()) next.customerAddress = "Customer address is required.";
    if (!places.some((state) => state.code === form.placeOfSupplyCode)) next.placeOfSupplyCode = "Choose a valid state code from the suggestions.";
    if (String(form.volume).trim() && (!Number.isFinite(Number(form.volume)) || Number(form.volume) <= 0)) next.volume = "Volume must be greater than 0.";
    if (form.containerNo.trim() && !/^[A-Z]{4}\d{7}$/i.test(form.containerNo.trim())) next.containerNo = "Use a 4-letter owner code followed by 7 digits, or leave blank.";
    if (form.customerGstin.trim() && !GSTIN_REGEX.test(form.customerGstin.trim().toUpperCase())) {
      next.customerGstin = "Enter a valid 15-character GSTIN, or leave it blank.";
    }
    const isEmptyTrailingCharge = (row, index) => index === calculatedCharges.length - 1
      && !row.description.trim()
      && !row.sac.trim()
      && (!String(row.rateText).trim() || Number(row.rateText) === 0);
    if (!charges.some((row, index) => !isEmptyTrailingCharge(row, index))) {
      next.charges = "Add at least one completed charge.";
    }
    calculatedCharges.forEach((row, index) => {
      if (isEmptyTrailingCharge(row, index)) return;
      if (!row.description.trim()) next[`charge-${row.id}-description`] = "Description is required.";
      if (!SAC_REGEX.test(row.sac.trim())) next[`charge-${row.id}-sac`] = "SAC must contain 6 digits.";
      const rawQty = Number(row.qty);
      const rawRate = Number(row.rate);
      const rawExchangeRate = Number(row.exchangeRate);
      const rawGstRate = Number(row.gstRate);
      if (!currencies.includes(row.currency)) next[`charge-${row.id}-currency`] = "Select a supported currency.";
      if (String(row.qty).trim() === "" || !Number.isFinite(rawQty) || rawQty <= 0) next[`charge-${row.id}-qty`] = "Quantity must be greater than 0.";
      if (String(row.rate).trim() === "" || !Number.isFinite(rawRate) || rawRate < 0) next[`charge-${row.id}-rate`] = "Enter a valid rate of 0 or more.";
      if (String(row.exchangeRate).trim() === "" || !Number.isFinite(rawExchangeRate) || rawExchangeRate <= 0) next[`charge-${row.id}-exchangeRate`] = `Set the INR value for ${row.currency} in Currencies settings.`;
      if (String(row.gstRate).trim() === "" || !Number.isFinite(rawGstRate) || rawGstRate < 0 || rawGstRate > 100) next[`charge-${row.id}-gstRate`] = "GST rate must be between 0 and 100.";
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handlePrint = () => {
    if (validate()) {
      window.print();
    }
  };

  const validationLabel = (key) => {
    const chargeError = key.match(/^charge-(\d+)-(.+)$/);
    if (chargeError) {
      const rowNumber = charges.findIndex((charge) => String(charge.id) === chargeError[1]) + 1;
      const fieldLabels = {
        description: "Description",
        sac: "SAC code",
        qty: "Quantity",
        rate: "Rate",
        currency: "Currency",
        exchangeRate: "INR exchange rate",
        gstRate: "GST rate",
      };
      return `Charge ${rowNumber || ""} ${fieldLabels[chargeError[2]] || chargeError[2]}`.trim();
    }

    return ({
      proformaNo: "Invoice number",
      date: "Invoice date",
      customerName: "Customer name",
      customerAddress: "Customer address",
      customerGstin: "Customer GSTIN",
      placeOfSupplyCode: "Place of supply",
      volume: "Volume",
      containerNo: "Container number",
      charges: "Invoice charges",
    })[key] || key;
  };

  const handleManagementArrowNavigation = (event) => {
    if (page === "invoice" || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return;
    const field = event.target;
    if (!field.matches?.("input, textarea") || field.disabled || field.readOnly) return;
    const managementPage = field.closest(".management-page");
    if (!managementPage) return;

    const fields = Array.from(managementPage.querySelectorAll("input:not(:disabled), textarea:not(:disabled)"))
      .filter((entry) => entry.getClientRects().length > 0);
    const nextField = fields[fields.indexOf(field) + (event.key === "ArrowUp" ? -1 : 1)];
    event.preventDefault();
    nextField?.focus();
  };

  return (
    <div className="bill-app" onKeyDownCapture={handleManagementArrowNavigation}>
      <header className="bill-toolbar">
        {page === "invoice" && <div className="toolbar-brand">
          <span className="toolbar-eyebrow">IET LOGISTICS</span>
          <h1>{mode === "create" ? "Create invoice" : "Billing workspace"}</h1>
          <p>Create, review, and print invoices</p>
        </div>}
        <div className="toolbar-actions">
          {onHome && <button type="button" className="btn btn-light" onClick={onHome}>Back to Home</button>}
          <label className="page-navigation">
            <select className="page-nav-select" aria-label="Select a workspace page" value={page} onChange={(event) => handlePageSelection(event.target.value)}>
              {WORKSPACE_PAGES.map((workspacePage) => <option key={workspacePage.id} value={workspacePage.id}>{workspacePage.label}</option>)}
              <option value="logout">Log out</option>
            </select>
          </label>
          {page === "invoice" && <button type="button" className="btn btn-primary" onClick={handlePrint}>Print / Save PDF</button>}
        </div>
      </header>

      {invoiceSaveError && <div className="invoice-save-error" role="alert">{invoiceSaveError}</div>}

      {page === "invoice" && Object.values(errors).some(Boolean) && (
        <div className="invoice-validation-summary" role="alert">
          <strong>Fix these issues before printing:</strong>
          <ul>{Object.entries(errors).filter(([, error]) => Boolean(error)).map(([key, error]) => (
            <li key={key}><strong>{validationLabel(key)}:</strong> {error}</li>
          ))}</ul>
        </div>
      )}

      {page === "invoice" ? <div className="bill-workspace preview-mode">
        <PreviewPage
          COMPANY={COMPANY}
          form={form}
          dateForPrint={dateForPrint}
          calculatedCharges={calculatedCharges}
          money={money}
          totals={totals}
          amountInWords={amountInWords}
          taxSummary={taxSummary}
          currencies={currencies}
          currencySettings={currencySettings}
          gstRates={gstRates}
          items={items}
          places={places}
          customers={customers}
          errors={errors}
          updateField={updateField}
          updatePlaceOfSupply={updatePlaceOfSupply}
          updateCharge={updateCharge}
          updateChargeCurrency={updateChargeCurrency}
          onSelectCustomer={useCustomer}
          applyCatalogItem={applyCatalogItem}
          addCharge={addCharge}
          removeCharge={removeCharge}
          canRemoveCharge={calculatedCharges.length > 1}
        />
      </div> : page === "currencies" ? <CurrencyPage
        currencies={currencySettings}
        onCurrenciesChange={setCurrencySettings}
        inUseCurrencies={[...new Set(charges.map((charge) => charge.currency))]}
        onSave={saveWorkspaceDataNow}
      /> : page === "rates" ? <RatePage
        rates={gstRates}
        onChange={setGstRates}
        inUseRates={[...charges.map((charge) => Number(charge.gstRate)), ...items.map((item) => Number(item.gstRate))]}
        onSave={saveWorkspaceDataNow}
      />
        : page === "items" ? <ItemsPage items={items} gstRates={gstRates} onChange={setItems} onSave={saveWorkspaceDataNow} />
          : page === "customers" ? <CustomersPage customers={customers} onChange={setCustomers} onUseCustomer={useCustomer} onSaveCustomers={saveWorkspaceDataNow} />
          : <PlaceOfSupplyPage
            places={places}
            onPlacesChange={setPlaces}
            onSave={saveWorkspaceDataNow}
          />}


    </div>
  );
}
