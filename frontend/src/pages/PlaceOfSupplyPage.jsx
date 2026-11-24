import React, { useEffect, useRef } from "react";
import "../Style/bill.css";
import SaveButton from "../Components/SaveButton.jsx";

// GST state codes and names shown in TallyPrime's state list.
export const STATES = [
  ["01", "Jammu & Kashmir"], ["02", "Himachal Pradesh"], ["03", "Punjab"], ["04", "Chandigarh"],
  ["05", "Uttarakhand"], ["06", "Haryana"], ["07", "Delhi"], ["08", "Rajasthan"],
  ["09", "Uttar Pradesh"], ["10", "Bihar"], ["11", "Sikkim"], ["12", "Arunachal Pradesh"],
  ["13", "Nagaland"], ["14", "Manipur"], ["15", "Mizoram"], ["16", "Tripura"],
  ["17", "Meghalaya"], ["18", "Assam"], ["19", "West Bengal"], ["20", "Jharkhand"],
  ["21", "Odisha"], ["22", "Chhattisgarh"], ["23", "Madhya Pradesh"], ["24", "Gujarat"],
  ["26", "Dadra and Nagar Haveli and Daman and Diu"], ["27", "Maharashtra"], ["29", "Karnataka"],
  ["30", "Goa"], ["31", "Lakshadweep"], ["32", "Kerala"], ["33", "Tamil Nadu"],
  ["34", "Pondicherry"], ["35", "Andaman and Nicobar Islands"], ["36", "Telangana"],
  ["37", "Andhra Pradesh"], ["38", "Ladakh"], ["96", "Foreign Country"], ["97", "Other Territory"],
].map(([code, name]) => ({ code, name }));

export default function PlaceOfSupplyPage({ places, onPlacesChange, onSave }) {
  const pendingCodeFocus = useRef(null);
  const addPlace = () => {
    pendingCodeFocus.current = places.length;
    onPlacesChange((current) => [...current, { code: "", name: "" }]);
  };

  useEffect(() => {
    if (pendingCodeFocus.current === null) return;
    document.getElementById(`place-code-${pendingCodeFocus.current}`)?.focus();
    pendingCodeFocus.current = null;
  }, [places]);

  const updatePlace = (index, field, value) => onPlacesChange((current) => current.map((place, placeIndex) =>
    placeIndex === index ? { ...place, [field]: field === "code" ? value.replace(/\D/g, "").slice(0, 2) : value } : place
  ));

  return (
    <div className="config bill-app">
      <section className="management-page">
        <div className="management-heading"><div><span className="section-kicker">GST STATE LIST</span><h2>Place of supply</h2><p>Add or edit a place and its state code, then select it for the invoice.</p></div><div className="management-heading-actions">{onSave && <SaveButton onSave={onSave} revision={JSON.stringify(places)} />}<button type="button" className="btn btn-primary" onClick={addPlace}>Add place</button></div></div>
        <div className="place-state-list">
          {places.map(({ code, name }, index) => (
            <article className="place-state-row" key={`${code}-${index}`}>
              <label className="bill-field place-state-code-field"><span className="bill-field-label">Code</span><input id={`place-code-${index}`} inputMode="numeric" maxLength="2" value={code} onChange={(event) => updatePlace(index, "code", event.target.value)} /></label>
              <label className="bill-field place-state-name-field"><span className="bill-field-label">Place / state name</span><input value={name} onChange={(event) => updatePlace(index, "name", event.target.value)} /></label>
              <div className="place-state-actions"><button type="button" className="btn btn-danger" aria-label={`Remove ${name || "place"}`} onClick={() => onPlacesChange((current) => current.filter((_, placeIndex) => placeIndex !== index))}>Remove</button></div>
            </article>
          ))}
          {places.length === 0 && <p className="empty-state">No places saved. Add one to use it on an invoice.</p>}
        </div>
      </section>
    </div>
  );
}
