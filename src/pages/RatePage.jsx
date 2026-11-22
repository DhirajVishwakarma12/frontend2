import React, { useState } from "react";
import "../Style/bill.css";

export default function RatePage({ rates, onChange, inUseRates = [] }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const addRate = (event) => {
    event.preventDefault();
    const rate = Number(value);
    if (!value.trim() || !Number.isFinite(rate) || rate < 0 || rate > 100) {
      setError("Enter a GST rate from 0% to 100%.");
      return;
    }
    if (rates.includes(rate)) {
      setError("That rate already exists.");
      return;
    }
    onChange((current) => [...current, rate].sort((a, b) => a - b));
    setValue("");
    setError("");
  };

  return (
    <div className="config bill-app">
      <section className="management-page">
        <div className="management-heading"><div><span className="section-kicker">GST CONFIGURATION</span><h2>Tax rates</h2><p>Maintain the GST rates available on invoice charges.</p></div></div>
        <div className="settings-card">
          <div className="rate-chip-list">
            {rates.map((rate) => <span className="rate-chip" key={rate}>{rate}% <button type="button" disabled={inUseRates.includes(Number(rate))} aria-label={`Remove ${rate}% rate`} onClick={() => onChange((current) => current.filter((item) => item !== rate))}>×</button></span>)}
          </div>
          <form className="currency-add-form" onSubmit={addRate}>
            <h3>Add GST rate</h3>
            <div className="inline-add-control"><label className="bill-field"><span className="bill-field-label">Rate (%)</span><input type="number" min="0" max="100" step="any" value={value} onChange={(event) => setValue(event.target.value)} /></label><button type="submit" className="btn btn-primary">Add rate</button></div>
            {error && <p className="field-error" role="alert">{error}</p>}
          </form>
        </div>
      </section>
    </div>
  );
}
