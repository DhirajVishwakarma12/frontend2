import React, { useEffect, useRef, useState } from "react";
import "../Style/bill.css";

const blankCustomer = () => ({
  id: Date.now(),
  name: "",
  gstin: "",
  address: "",
  email: "",
  phone: "",
});

export default function CustomersPage({ customers, onChange, onUseCustomer }) {
  const [message, setMessage] = useState("");
  const pendingCustomerFocus = useRef(null);

  useEffect(() => {
    if (pendingCustomerFocus.current === null) return;
    document.getElementById(`customer-name-${pendingCustomerFocus.current}`)?.focus();
    pendingCustomerFocus.current = null;
  }, [customers]);

  const handleFieldKeyDown = (event) => {
    if (event.key !== "Enter" || event.currentTarget.tagName === "TEXTAREA") return;
    event.preventDefault();
    const fields = Array.from(event.currentTarget.closest(".customer-config-card").querySelectorAll("input, textarea"));
    const nextField = fields[fields.indexOf(event.currentTarget) + 1];
    nextField?.focus();
  };

  const updateCustomer = (id, field, value) => {
    onChange((current) => current.map((customer) =>
      customer.id === id ? { ...customer, [field]: value } : customer
    ));
  };

  const addCustomer = () => {
    const customer = blankCustomer();
    pendingCustomerFocus.current = customer.id;
    onChange((current) => [...current, customer]);
    setMessage("");
  };

  return (
    <div className="config bill-app">
      <section className="management-page">
        <div className="management-heading">
          <div>
            <span className="section-kicker">CUSTOMERS</span>
            <h2>Customer directory</h2>
            <p>Save customer details and reuse them on proforma invoices.</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={addCustomer}>Add customer</button>
        </div>
        {message && <p role="status" className="settings-description">{message}</p>}
        <div className="catalog-list">
          {customers.map((customer) => (
            <article className="catalog-card customer-config-card" key={customer.id}>
              <label className="bill-field customer-name-field">
                <span className="bill-field-label">Customer name</span>
                <input id={`customer-name-${customer.id}`} value={customer.name} onChange={(event) => updateCustomer(customer.id, "name", event.target.value)} onKeyDown={handleFieldKeyDown} />
              </label>
              <label className="bill-field">
                <span className="bill-field-label">GSTIN</span>
                <input value={customer.gstin} onChange={(event) => updateCustomer(customer.id, "gstin", event.target.value.toUpperCase())} onKeyDown={handleFieldKeyDown} maxLength={15} />
              </label>
              <label className="bill-field">
                <span className="bill-field-label">Phone</span>
                <input value={customer.phone} onChange={(event) => updateCustomer(customer.id, "phone", event.target.value)} onKeyDown={handleFieldKeyDown} />
              </label>
              <label className="bill-field customer-address-field">
                <span className="bill-field-label">Billing address</span>
                <textarea rows={3} value={customer.address} onChange={(event) => updateCustomer(customer.id, "address", event.target.value)} onKeyDown={handleFieldKeyDown} />
              </label>
              <label className="bill-field">
                <span className="bill-field-label">Email</span>
                <input type="email" value={customer.email} onChange={(event) => updateCustomer(customer.id, "email", event.target.value)} onKeyDown={handleFieldKeyDown} />
              </label>
              <div className="customer-config-actions">
                <button type="button" className="btn btn-light" disabled={!customer.name.trim()} onClick={() => { onUseCustomer(customer); setMessage(`${customer.name} applied to the invoice.`); }}>Use on invoice</button>
                <button type="button" className="btn btn-danger" onClick={() => onChange((current) => current.filter((entry) => entry.id !== customer.id))}>Remove</button>
              </div>
            </article>
          ))}
          {customers.length === 0 && <p className="empty-state">No customers yet. Add a customer to start your directory.</p>}
        </div>
      </section>
    </div>
  );
}
