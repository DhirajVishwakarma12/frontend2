import React, { useEffect, useRef } from "react";
import "../Style/bill.css";
import SaveButton from "../Components/SaveButton.jsx";

export default function ItemsPage({ items, gstRates, onChange, onSave }) {
  const pendingNameFocus = useRef(null);

  useEffect(() => {
    if (pendingNameFocus.current === null) return;
    document.getElementById(`item-name-${pendingNameFocus.current}`)?.focus();
    pendingNameFocus.current = null;
  }, [items]);

  const updateItem = (id, field, value) => {
    onChange((current) => current.map((item) => item.id === id ? { ...item, [field]: value } : item));
  };

  const addItem = () => {
    pendingNameFocus.current = items.length;
    onChange((current) => [...current, {
      id: Date.now(), description: "", sac: "", rate: "0", gstRate: "18",
    }]);
  };

  return (
    <div className="config bill-app">
      <section className="management-page">
        <div className="management-heading"><div><span className="section-kicker">ITEMS</span><h2>Items and charges</h2><p>Save reusable charge details and add them to the open invoice.</p></div><div className="management-heading-actions">{onSave && <SaveButton onSave={onSave} revision={JSON.stringify(items)} />}<button type="button" className="btn btn-primary" onClick={addItem}>Add item</button></div></div>
        <div className="catalog-list">
          {items.map((item, index) => (
            <article className="catalog-card item-config-card" key={item.id}>
              <label className="bill-field"><span className="bill-field-label">Item / charge name</span><input id={`item-name-${index}`} value={item.description} onChange={(event) => updateItem(item.id, "description", event.target.value)} /></label>
              <label className="bill-field"><span className="bill-field-label">SAC code</span><input value={item.sac} onChange={(event) => updateItem(item.id, "sac", event.target.value)} /></label>
              <label className="bill-field"><span className="bill-field-label">Default rate (INR)</span><input type="number" min="0" step="any" aria-label={`Default rate in INR for ${item.description || "new item"}`} value={item.rate ?? ""} onChange={(event) => updateItem(item.id, "rate", event.target.value)} /></label>
              <label className="bill-field"><span className="bill-field-label">Tax rate (GST)</span><select aria-label={`Tax rate for ${item.description || "new item"}`} value={String(item.gstRate ?? "18")} onChange={(event) => updateItem(item.id, "gstRate", event.target.value)}>{gstRates.map((rate) => <option key={rate} value={String(rate)}>{rate}%</option>)}</select></label>
              <div className="item-config-actions"><button type="button" className="btn btn-danger" onClick={() => onChange((current) => current.filter((entry) => entry.id !== item.id))}>Remove</button></div>
            </article>
          ))}
          {items.length === 0 && <p className="empty-state">No items yet. Add an item to build your reusable charge list.</p>}
        </div>
      </section>
    </div>
  );
}
