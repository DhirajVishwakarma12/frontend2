import React from 'react'

const formatQuantity = (value) => Number(value || 0).toLocaleString("en-IN", {
  maximumFractionDigits: 3,
});

const formatRate = (value) => {
  const rawValue = String(value ?? "").trim();
  if (!rawValue) return "";
  const [whole, fraction] = rawValue.replace(/,/g, "").split(".");
  const wholeNumber = Number(whole);
  if (!Number.isFinite(wholeNumber)) return rawValue;
  const groupedWhole = wholeNumber.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  return `${groupedWhole}.${fraction || "00"}`;
};

function focusInvoiceField(currentTarget, direction = 1) {
  const invoicePage = currentTarget.closest(".invoice-page");
  if (!invoicePage) return;

  const fields = Array.from(invoicePage.querySelectorAll(
    'input:not([type="hidden"]), textarea, select, [role="textbox"][tabindex="0"]'
  ));
  const nextField = fields[fields.indexOf(currentTarget) + direction];
  if (!nextField) return;

  currentTarget.blur();
  window.requestAnimationFrame(() => {
    if (invoicePage.contains(nextField)) nextField.focus();
  });
}

function handleInvoiceFieldKeyDown(event) {
  const { key, currentTarget } = event;
  const isSelect = currentTarget.tagName === "SELECT";
  const hasCaret = typeof currentTarget.selectionStart === "number";

  if (key === "Enter") {
    event.preventDefault();
    focusInvoiceField(currentTarget, 1);
  } else if (key === "ArrowDown" && !isSelect) {
    event.preventDefault();
    focusInvoiceField(currentTarget, 1);
  } else if (key === "ArrowUp" && !isSelect) {
    event.preventDefault();
    focusInvoiceField(currentTarget, -1);
  } else if (key === "ArrowRight" && hasCaret) {
    const atEnd = currentTarget.selectionStart === currentTarget.value.length
      && currentTarget.selectionEnd === currentTarget.value.length;
    if (atEnd) {
      event.preventDefault();
      focusInvoiceField(currentTarget, 1);
    }
  } else if (key === "ArrowLeft" && hasCaret) {
    const atStart = currentTarget.selectionStart === 0 && currentTarget.selectionEnd === 0;
    if (atStart) {
      event.preventDefault();
      focusInvoiceField(currentTarget, -1);
    }
  }
}

function PlaceOfSupplyPicker({ code, name, places, onSelect }) {
  const [query, setQuery] = React.useState(code);
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef(null);
  const matches = places.filter((state) => state.code.startsWith(query.trim())).slice(0, 8);

  const selectState = (state) => {
    onSelect(state.code);
    setQuery(state.code);
    setIsOpen(false);
    setActiveIndex(0);
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      focusInvoiceField(event.currentTarget, -1);
    } else if (event.key === "ArrowDown" && isOpen && matches.length) {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % matches.length);
    } else if (event.key === "Enter" && isOpen && matches.length) {
      event.preventDefault();
      selectState(matches[activeIndex] || matches[0]);
    } else if (event.key === "Escape") {
      setIsOpen(false);
      setQuery(code);
    } else if ((event.key === "Enter" || event.key === "ArrowDown") && !isOpen && places.some((state) => state.code === code)) {
      handleInvoiceFieldKeyDown(event);
    }
  };

  return (
    <span className="place-of-supply-picker screen-only">
      <input
        ref={inputRef}
        className="invoice-place-select"
        aria-label="Type a state code"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls="place-of-supply-state-suggestions"
        inputMode="numeric"
        maxLength={2}
        value={query}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          setIsOpen(false);
          setQuery(code);
        }}
        onChange={(event) => {
          const nextQuery = event.target.value.replace(/\D/g, "").slice(0, 2);
          setQuery(nextQuery);
          setActiveIndex(0);
          setIsOpen(true);
          const exactMatch = places.find((state) => state.code === nextQuery);
          if (exactMatch) onSelect(exactMatch.code);
        }}
        onKeyDown={handleKeyDown}
      />
      <span className="place-of-supply-name">{name}</span>
      {isOpen && matches.length > 0 && (
        <span className="place-supply-suggestions" id="place-of-supply-state-suggestions" role="listbox">
          {matches.map((state, index) => (
            <button
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              className={index === activeIndex ? "is-active" : ""}
              key={state.code}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectState(state)}
            >
              <strong>{state.code}</strong><span>{state.name}</span>
            </button>
          ))}
        </span>
      )}
    </span>
  );
}

function RatePicker({ value, rates, onSelect }) {
  return (
    <span className="invoice-rate-picker">
      <select
        className="invoice-rate-select screen-only"
        aria-label="Select GST rate"
        value={String(value)}
        onChange={(event) => onSelect(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            focusInvoiceField(event.currentTarget, -1);
          } else if (event.key === "Enter") {
            event.preventDefault();
            focusInvoiceField(event.currentTarget, 1);
          }
        }}
      >
        {rates.map((rate) => <option key={rate} value={String(rate)}>{rate}%</option>)}
      </select>
      <span className="invoice-rate-print">{value}%</span>
    </span>
  );
}

function DescriptionPicker({ chargeId, value, items, error, onChange, onSelectItem }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value || "");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef(null);
  const skipBlurCommit = React.useRef(false);
  const matches = draft.trim()
    ? items.filter((item) => item.description?.toLowerCase().includes(draft.trim().toLowerCase())).slice(0, 7)
    : [];

  React.useEffect(() => {
    if (!editing) setDraft(value || "");
  }, [value, editing]);

  React.useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    onChange(draft.trim());
    setEditing(false);
  };

  const selectItem = (item) => {
    skipBlurCommit.current = true;
    onSelectItem(item);
    setDraft(item.description);
    setEditing(false);
    if (inputRef.current) focusInvoiceField(inputRef.current, 2);
  };

  if (!editing) {
    return <>
      <span id={`charge-description-${chargeId}`} className={`direct-editable screen-only${error ? " has-error" : ""}`} role="textbox" tabIndex={0} aria-label="Edit charge description" onFocus={() => setEditing(true)} onClick={() => setEditing(true)} onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setEditing(true);
        }
      }}>{value || ""}</span>
      <span className="description-print-text">{value || ""}</span>
    </>;
  }

  return <>
    <span className="description-picker screen-only"><input
      ref={inputRef}
      className={`description-picker-input${error ? " has-error" : ""}`}
      aria-label="Type a charge description"
      aria-invalid={Boolean(error)}
      value={draft}
      onChange={(event) => { setDraft(event.target.value); setActiveIndex(0); }}
      onBlur={() => {
        if (skipBlurCommit.current) {
          skipBlurCommit.current = false;
          return;
        }
        commit();
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowUp") {
          event.preventDefault();
          focusInvoiceField(event.currentTarget, -1);
        } else if (event.key === "ArrowDown" && matches.length) {
          event.preventDefault();
          setActiveIndex((current) => (current + 1) % matches.length);
        } else if (event.key === "Enter") {
          event.preventDefault();
          if (matches.length) selectItem(matches[activeIndex] || matches[0]);
          else {
            commit();
            focusInvoiceField(event.currentTarget, 1);
          }
        } else if (event.key === "Escape") {
          setDraft(value || "");
          setEditing(false);
        }
      }}
    />
      {matches.length > 0 && <span className="description-suggestions" role="listbox">
        {matches.map((item, index) => <button type="button" role="option" aria-selected={index === activeIndex} className={index === activeIndex ? "is-active" : ""} key={item.id} onMouseDown={(event) => event.preventDefault()} onClick={() => selectItem(item)}><strong>{item.description}</strong><span>SAC {item.sac} · Rate {item.rate}</span></button>)}
      </span>}
    </span><span className="description-print-text">{value || draft}</span>
  </>;
}

function EditableText({ value, onChange, className = "", multiline = false, numeric = false, error }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value ?? "");
  const inputRef = React.useRef(null);
  const startingValueRef = React.useRef(value ?? "");

  React.useEffect(() => {
    if (!editing) setDraft(value ?? "");
  }, [value, editing]);

  React.useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length);
    }
  }, [editing]);

  React.useEffect(() => {
    if (!editing || !inputRef.current) return;
    const input = inputRef.current;
    const text = draft || "";
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const styles = window.getComputedStyle(input);
    context.font = `${styles.fontSize} ${styles.fontFamily}`;
    const measuredWidth = Math.ceil(context.measureText(text || " ").width);
    const minimumWidth = multiline ? (className ? 300 : 160) : 90;
    const maximumWidth = multiline ? (className ? 520 : 360) : 260;
    input.style.width = `${Math.min(maximumWidth, Math.max(minimumWidth, measuredWidth + 24))}px`;
  }, [draft, editing, multiline]);

  const handleChange = (event) => {
    const nextValue = event.currentTarget.value;
    setDraft(nextValue);
    onChange(nextValue);
  };

  const commit = (event) => {
    const nextValue = event.currentTarget.value.trim();
    if (!numeric) onChange(nextValue);
    else if (nextValue === "") onChange("");
    else if (Number.isFinite(Number(nextValue))) onChange(String(Number(nextValue)));
    setEditing(false);
  };

  const startEditing = () => {
    startingValueRef.current = value ?? "";
    setDraft(startingValueRef.current);
    setEditing(true);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      onChange(startingValueRef.current);
      setEditing(false);
      setDraft(startingValueRef.current);
    } else if (event.key === "Enter" && (!multiline || event.ctrlKey)) {
      event.preventDefault();
      focusInvoiceField(event.currentTarget, 1);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp"
      || event.key === "ArrowLeft" || event.key === "ArrowRight") {
      handleInvoiceFieldKeyDown(event);
    }
  };

  const sharedProps = {
    ref: inputRef,
    className: `direct-editable-input ${className}${error ? " has-error" : ""}`,
    "aria-label": "Edit invoice value",
    "aria-invalid": Boolean(error),
    placeholder: "Enter value",
    value: draft,
    onChange: handleChange,
    onBlur: commit,
    onKeyDown: handleKeyDown,
    inputMode: numeric ? "decimal" : undefined,
  };

  return editing ? (
    multiline ? <textarea {...sharedProps} rows={2} /> : <input {...sharedProps} type="text" />
  ) : (
    <span
      className={`direct-editable ${className}${error ? " has-error" : ""}`}
      role="textbox"
      aria-label="Edit invoice value"
      aria-invalid={Boolean(error)}
      data-empty={!draft && !value ? "true" : "false"}
      tabIndex={0}
      onClick={startEditing}
      onFocus={startEditing}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          startEditing();
        }
      }}
    >
      {value || ""}
    </span>
  );
}

const PreviewPage = ({ COMPANY, form, dateForPrint, calculatedCharges, money, totals, amountInWords, taxSummary, currencies, gstRates, items, places, errors, updateField, updatePlaceOfSupply, updateCharge, updateChargeCurrency, applyCatalogItem, addCharge, removeCharge, canRemoveCharge }) => {
  const missingExchangeRates = calculatedCharges.filter((row) =>
    row.currency !== "INR" && (!Number.isFinite(Number(row.exchangeRate)) || Number(row.exchangeRate) <= 0)
  ).length;
  const exchangeRates = [...new Map(calculatedCharges
    .filter((row) => row.currency !== "INR" && Number(row.exchangeRate) > 0)
    .map((row) => [`${row.currency}-${row.exchangeRate}`, `1 ${row.currency} = ${money(row.exchangeRate)} INR`])).values()];

  return (
    <section className="preview-column">
      <div className="preview-heading">
        <div className="preview-heading-actions">
          <label className="preview-tax-control screen-only">
            <span>Tax treatment</span>
            <select value={form.taxMode} onChange={(event) => updateField("taxMode")(event.target.value)}>
              <option value="intra">Within state · CGST + SGST</option>
              <option value="inter">Interstate · IGST</option>
            </select>
          </label>
        </div>
      </div>
      <article className="invoice-page compact-invoice">
        <div className="invoice-watermark">WHITE STAR<small>SHIPPING PVT. LTD.</small></div>
        <header className="invoice-header">
          <div className="invoice-logo"><div className="logo-star">✦</div><div className="logo-name">WHITE STAR</div><div className="logo-sub">SHIPPING PVT. LTD.</div></div>
          <div className="invoice-company"><h1>{COMPANY.name}</h1>{COMPANY.address.map((line) => <p key={line}>{line}</p>)}<p>{COMPANY.contact}</p></div>
        </header>
        <div className="invoice-title">P R O F O R M A&nbsp; I N V O I C E</div>

        <section className="invoice-details-box">
          <div className="invoice-party-details">
            <div className="invoice-detail-row"><strong>Customer</strong><span><EditableText value={form.customerName} onChange={updateField("customerName")} error={errors.customerName} /></span></div>
            <EditableText className="customer-address-edit" value={form.customerAddress} onChange={updateField("customerAddress")} multiline error={errors.customerAddress} />
            {[
              ["GSTIN", "customerGstin", form.customerGstin],
              ["BL No.", "blNo", form.blNo],
              ["Booking No", "bookingNo", form.bookingNo],
              ["Shipper", "shipper", form.shipper],
              ["Port Of Loading", "portLoading", form.portLoading],
              ["Port Of Discharge", "portDischarge", form.portDischarge],
              ["Place Of Delivery", "placeDelivery", form.placeDelivery],
              ["Container No.", "containerNo", form.containerNo],
            ].map(([label, field, value]) => <div className="invoice-detail-row" key={label}><strong>{label}</strong><span><EditableText value={value} onChange={updateField(field)} error={errors[field]} /></span></div>)}
            <div className="invoice-detail-row"><strong>Place of Supply</strong><span className="place-of-supply-value"><PlaceOfSupplyPicker code={form.placeOfSupplyCode} name={form.placeOfSupply} places={places} onSelect={updatePlaceOfSupply} /><span className="place-of-supply-print">({form.placeOfSupplyCode}) {form.placeOfSupply}</span></span></div>
            <div className="invoice-detail-row"><strong>Volume</strong><span className="volume-container-value"><EditableText value={form.volume} onChange={updateField("volume")} numeric error={errors.volume} /><span className="invoice-inline-x">x</span><EditableText value={form.containerType} onChange={updateField("containerType")} /></span></div>
          </div>
          <div className="invoice-extra-details">
            {[["Proforma", "proformaNo", form.proformaNo], ["Date", "date", dateForPrint(form.date)], ["LT Date", "ltDate", dateForPrint(form.ltDate)], ["BL No", "blNo", form.blNo]].map(([label, field, value]) =>
              <div className="invoice-right-row" key={label}><strong>{label}</strong><span>
                {field === "date" || field === "ltDate"
                  ? <EditableText value={value} onChange={(nextValue) => updateField(field)(nextValue.split("/").reverse().join("-"))} error={errors[field]} />
                  : <EditableText value={value} onChange={updateField(field)} error={errors[field]} />}
              </span></div>)}
            <div className="invoice-vessel-block" />
            <div className="invoice-right-row"><strong>Vessel Voy</strong><span><EditableText value={form.vessel} onChange={updateField("vessel")} /> <EditableText value={form.voyage} onChange={updateField("voyage")} /></span></div>
            <div className="invoice-right-row"><strong>Date Of Sailing</strong><span><EditableText value={dateForPrint(form.sailing)} onChange={(value) => updateField("sailing")(value.split("/").reverse().join("-"))} /></span></div>
            <div className="invoice-right-row"><strong>Prepared By</strong><span><EditableText value={form.preparedBy} onChange={updateField("preparedBy")} /></span></div>
          </div>
        </section>

        <table className={`invoice-charges ${form.taxMode === "inter" ? "interstate-table" : ""}`}>
          <thead>
            <tr>
              <th rowSpan="2" className="col-sr">SrNo.</th><th rowSpan="2" className="col-desc">Description</th><th rowSpan="2" className="col-sac">SAC</th>
              <th rowSpan="2" className="col-qty">Qty</th><th rowSpan="2" className="col-curr">Curr</th><th rowSpan="2" className="col-rate">Rate</th><th rowSpan="2" className="col-amount">Amount (INR)</th>
              {form.taxMode === "intra" ? <><th colSpan="2">CGST</th><th colSpan="2">SGST</th></> : <th colSpan="2">IGST</th>}
              <th rowSpan="2" className="col-total">Total (INR)</th>
            </tr>
            <tr>{form.taxMode === "intra" ? <><th>Rate</th><th>Amt (INR)</th><th>Rate</th><th>Amt (INR)</th></> : <><th>Rate</th><th>Amt (INR)</th></>}</tr>
          </thead>
          <tbody>
            {calculatedCharges.map((row, index) => (
              <tr key={row.id}>
                <td>{index + 1}</td><td className="charge-description-cell"><DescriptionPicker chargeId={row.id} value={row.description} items={items} error={errors[`charge-${row.id}-description`]} onChange={(value) => updateCharge(row.id, "description", value)} onSelectItem={(item) => applyCatalogItem(row.id, item)} /><button type="button" className="charge-row-remove screen-only" aria-label={`Remove item ${index + 1}`} title="Remove this item row" disabled={!canRemoveCharge} onClick={() => removeCharge(row.id)}>×</button></td><td className="center sac-cell"><EditableText value={row.sac} onChange={(value) => updateCharge(row.id, "sac", value)} error={errors[`charge-${row.id}-sac`]} /></td>
                <td className="num"><EditableText value={formatQuantity(row.qty)} onChange={(value) => updateCharge(row.id, "qty", value)} numeric error={errors[`charge-${row.id}-qty`]} /></td>
                <td className="center currency-cell">
                  <select className="invoice-currency-select" aria-label={`Currency for charge ${index + 1}`} aria-invalid={Boolean(errors[`charge-${row.id}-currency`])} value={row.currency} onChange={(event) => updateChargeCurrency(row.id, event.target.value)} onKeyDown={(event) => {
                    if (event.key === "ArrowLeft") {
                      event.preventDefault();
                      focusInvoiceField(event.currentTarget, -1);
                    } else {
                      handleInvoiceFieldKeyDown(event);
                    }
                  }}>
                    {currencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
                  </select>
                  {row.currency !== "INR" && (
                    <span className="invoice-fx-entry screen-only">1 {row.currency} = {Number(row.exchangeRate) > 0 ? money(row.exchangeRate) : "Not set"} INR</span>
                  )}
                </td>
                <td className="num"><EditableText value={formatRate(row.rateText)} onChange={(value) => updateCharge(row.id, "rate", value.replace(/,/g, ""))} error={errors[`charge-${row.id}-rate`]} /></td><td className="num">{money(row.amount)}</td>
                {form.taxMode === "intra" ? <><td className="center"><RatePicker value={row.gstRate / 2} rates={gstRates.map((rate) => Number(rate) / 2)} onSelect={(value) => updateCharge(row.id, "gstRate", String(Number(value) * 2))} /></td><td className="num">{money(row.cgst)}</td><td className="center"><RatePicker value={row.gstRate / 2} rates={gstRates.map((rate) => Number(rate) / 2)} onSelect={(value) => updateCharge(row.id, "gstRate", String(Number(value) * 2))} /></td><td className="num">{money(row.sgst)}</td></> : <><td className="center"><RatePicker value={row.gstRate} rates={gstRates.map(Number)} onSelect={(value) => updateCharge(row.id, "gstRate", value)} /></td><td className="num">{money(row.igst)}</td></>}
                <td className="num">{money(row.total)}</td>
              </tr>
            ))}
            <tr className="invoice-table-spacer" aria-hidden="true">
              {Array.from({ length: form.taxMode === "intra" ? 12 : 10 }, (_, index) => <td key={index} />)}
            </tr>
            <tr className="invoice-taxable-row">
              <td colSpan="6">Taxable Amount :&nbsp; {money(totals.taxable)}</td><td className="num">{money(totals.taxable)}</td>
              {form.taxMode === "intra" ? <><td /><td className="num">{money(totals.cgst)}</td><td /><td className="num">{money(totals.sgst)}</td></> : <><td /><td className="num">{money(totals.igst)}</td></>}
              <td className="num">{money(totals.total)}</td>
            </tr>
          </tbody>
        </table>
        <div className="invoice-add-charge-control screen-only">
          <button type="button" className="invoice-add-charge-button" aria-label="Add invoice row" onClick={addCharge}>+</button>
        </div>

        <div className="invoice-currency-note">
          <span>Charge rates use the selected currency; amount, tax and total values are in INR.</span>
          {exchangeRates.map((rate) => <span className="screen-only" key={rate}>{rate}</span>)}
          {missingExchangeRates > 0 && <strong className="currency-fx-warning screen-only">Enter the INR exchange rate in the currency column for {missingExchangeRates} foreign-currency charge(s) before printing.</strong>}
        </div>
        <div className="invoice-bottom-section">
        <div className="invoice-total-strip"><span>{amountInWords(totals.total)}</span><strong>Total Amount&nbsp;&nbsp; ₹ &nbsp;{money(totals.total)}</strong></div>
        <div className="invoice-remarks"><strong>Remarks :</strong> <EditableText value={form.remarks} onChange={updateField("remarks")} multiline /></div>

        <table className="invoice-tax-summary">
          <thead>
            <tr><th rowSpan="2">SAC</th><th rowSpan="2">Taxable (INR)</th><th rowSpan="2">GST Rate</th>{form.taxMode === "intra" ? <><th colSpan="2">SGST (INR)</th><th colSpan="2">CGST (INR)</th></> : <th>IGST Amount (INR)</th>}<th rowSpan="2">Total Tax (INR)</th></tr>
            <tr>{form.taxMode === "intra" ? <><th>Rate</th><th>Amount</th><th>Rate</th><th>Amount</th></> : <th>Rate</th>}</tr>
          </thead>
          <tbody>
            {taxSummary.map((row) => <tr key={`${row.sac}-${row.gstRate}`}>
              <td>{row.sac || "—"}</td><td className="num">{money(row.taxable)}</td><td>{row.gstRate}%</td>
              {form.taxMode === "intra" ? <><td>{row.gstRate / 2}%</td><td className="num">{money(row.sgst)}</td><td>{row.gstRate / 2}%</td><td className="num">{money(row.cgst)}</td></> : <><td className="num">{money(row.igst)}</td></>}
              <td className="num">{money(row.tax)}</td>
            </tr>)}
            <tr className="summary-total-row"><td><strong>Total</strong></td><td className="num">{money(totals.taxable)}</td><td />{form.taxMode === "intra" ? <><td /><td className="num">{money(totals.sgst)}</td><td /><td className="num">{money(totals.cgst)}</td></> : <><td className="num">{money(totals.igst)}</td></>}<td className="num">{money(totals.cgst + totals.sgst + totals.igst)}</td></tr>
          </tbody>
        </table>

        <section className="invoice-terms"><h3>Term &amp; Conditions</h3>
          <p>If we do not receive confirmation on PROFORMA INVOICE in next 2 days we will consider this as</p>
          <p>FINAL invoice and TAX / E-Invoice shall be raised. Once E-Invoice is generated it cannot be changed.</p>
          <p>If required, invoice cancellation charges of INR 1000 + GST will be applicable.</p>
        </section>
        <div className="invoice-bank-sign">
          <div><strong className="bank-title-print">Bank Account Details :</strong>
            <div className="bank-print-row"><strong>Beneficiary Name</strong><span>: &nbsp;{COMPANY.bank.beneficiary}</span></div>
            <div className="bank-print-row"><strong>Bank Name</strong><span>: &nbsp;{COMPANY.bank.name}</span></div>
            <div className="bank-print-row"><strong>Account Number</strong><span>: &nbsp;{COMPANY.bank.account}</span></div>
            <div className="bank-print-row"><strong>IFSC Code</strong><span>: &nbsp;{COMPANY.bank.ifsc}</span></div>
          </div>
          <div className="invoice-signature"><strong>For {COMPANY.name}</strong><div className="signature-gap" /><strong>Auth. Signatory</strong></div>
        </div>
        </div>
      </article>
    </section>
  )
}

export default PreviewPage;
