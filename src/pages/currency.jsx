import React, { useEffect, useState } from "react";
import "../Style/bill.css";

const STORAGE_KEY = "white-star-currency-rates";
const DEFAULT_CURRENCIES = [
  { code: "INR", name: "Indian Rupee", inrValue: "1" },
  { code: "USD", name: "US Dollar", inrValue: "" },
  { code: "AED", name: "UAE Dirham", inrValue: "" },
];

function loadCurrencies() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : DEFAULT_CURRENCIES;
  } catch {
    return DEFAULT_CURRENCIES;
  }
}

export default function CurrencyPage({ currencies: configuredCurrencies, onCurrenciesChange, inUseCurrencies = [] } = {}) {
  const [localCurrencies, setLocalCurrencies] = useState(loadCurrencies);
  const currencies = configuredCurrencies ?? localCurrencies;
  const setCurrencies = onCurrenciesChange ?? setLocalCurrencies;
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newInrValue, setNewInrValue] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!onCurrenciesChange) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(currencies));
  }, [currencies, onCurrenciesChange]);

  const updateCurrency = (code, inrValue) => {
    setCurrencies((current) => current.map((currency) =>
      currency.code === code ? { ...currency, inrValue } : currency
    ));
  };

  const addCurrency = (event) => {
    event.preventDefault();
    const code = newCode.trim().toUpperCase();
    const name = newName.trim();
    const value = Number(newInrValue);
    if (!/^[A-Z]{3}$/.test(code) || !name || newInrValue.trim() === "" || !Number.isFinite(value) || value <= 0) {
      setError("Enter a 3-letter code, currency name, and INR value greater than zero.");
      return;
    }
    if (currencies.some((currency) => currency.code === code)) {
      setError("That currency code already exists.");
      return;
    }
    setCurrencies((current) => [...current, { code, name, inrValue: String(value) }]);
    setNewCode("");
    setNewName("");
    setNewInrValue("");
    setError("");
  };

  const removeCurrency = (code) => {
    if (code !== "INR" && !inUseCurrencies.includes(code)) setCurrencies((current) => current.filter((currency) => currency.code !== code));
  };

  return (
    <div className="config">
      <main className="bill-app">
      <section className="management-page">
        <div className="management-heading">
          <div>
            <span className="section-kicker">CURRENCY CONFIGURATION</span>
            <h2>Supported currencies</h2>
            <p>Enter how many INR one unit of each currency is worth.</p>
          </div>
        </div>

        <div className="settings-card">
          <div className="catalog-list">
            {currencies.map((currency) => (
              <article className="catalog-card currency-setting-row" key={currency.code}>
                <div>
                  <strong>{currency.code}</strong>
                  <span>{currency.name}</span>
                </div>
                <label className="bill-field">
                  <span className="bill-field-label">INR value for 1 {currency.code}</span>
                  <input
                    type="number"
                    min="0.000001"
                    step="any"
                    value={currency.inrValue ?? ""}
                    disabled={currency.code === "INR"}
                    onChange={(event) => updateCurrency(currency.code, event.target.value)}
                    placeholder="Enter INR value"
                  />
                </label>
                {currency.code !== "INR" && (
                  <button type="button" className="btn btn-danger" disabled={inUseCurrencies.includes(currency.code)} onClick={() => removeCurrency(currency.code)}>Remove</button>
                )}
              </article>
            ))}
          </div>

          <form className="currency-add-form" onSubmit={addCurrency}>
            <h3>Add currency</h3>
            <div className="field-grid two-col">
              <label className="bill-field">
                <span className="bill-field-label">Currency code</span>
                <input value={newCode} maxLength={3} onChange={(event) => setNewCode(event.target.value.toUpperCase())} placeholder="e.g. EUR" />
              </label>
              <label className="bill-field">
                <span className="bill-field-label">Currency name</span>
                <input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="e.g. Euro" />
              </label>
              <label className="bill-field">
                <span className="bill-field-label">INR value for 1 unit</span>
                <input type="number" min="0.000001" step="any" value={newInrValue} onChange={(event) => setNewInrValue(event.target.value)} placeholder="e.g. 90" />
              </label>
            </div>
            {error && <p className="field-error" role="alert">{error}</p>}
            <button type="submit" className="btn btn-primary">Add currency</button>
          </form>
        </div>
      </section>
      </main>
    </div>
  );
}
