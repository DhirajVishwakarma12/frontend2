import { useEffect, useMemo, useState } from "react";
import { getUsers, resetUserPassword, updateUserEmail } from "../services/admin.js";
import { getInvoices } from "../services/invoices.js";
import { changeAdminPassword } from "../services/auth.js";
import "../Style/admin-dashboard.css";

const money = (value) => Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function invoiceTotal(invoice) {
  return (invoice.charges || []).reduce((total, charge) => {
    const amount = Number(charge.qty || 0) * Number(charge.rate || 0) * Number(charge.exchangeRate || 0);
    return total + amount * (1 + Number(charge.gstRate || 0) / 100);
  }, 0);
}

function dateLabel(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminDashboard({ user, onBack, onOpenInvoice, onCreateInvoice }) {
  const [section, setSection] = useState("invoices");
  const [invoices, setInvoices] = useState([]);
  const [users, setUsers] = useState([]);
  const [emailDrafts, setEmailDrafts] = useState({});
  const [passwordDrafts, setPasswordDrafts] = useState({});
  const [statuses, setStatuses] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [accountStatus, setAccountStatus] = useState("");
  const [savingAdminPassword, setSavingAdminPassword] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [invoiceData, userData] = await Promise.all([getInvoices(), getUsers()]);
      setInvoices(invoiceData.invoices || []);
      setUsers(userData.users || []);
      setEmailDrafts(Object.fromEntries((userData.users || []).map((entry) => [entry.id, entry.email])));
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const filteredInvoices = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return invoices;
    return invoices.filter((invoice) => [
      invoice.form?.proformaNo,
      invoice.form?.customerName,
      invoice.owner?.email,
    ].some((value) => String(value || "").toLowerCase().includes(term)));
  }, [invoices, search]);

  const saveEmail = async (account) => {
    setStatuses((current) => ({ ...current, [account.id]: "saving-email" }));
    try {
      const { user: updatedUser } = await updateUserEmail(account.id, emailDrafts[account.id]);
      setUsers((current) => current.map((entry) => entry.id === account.id ? updatedUser : entry));
      setEmailDrafts((current) => ({ ...current, [account.id]: updatedUser.email }));
      setStatuses((current) => ({ ...current, [account.id]: "Email updated" }));
    } catch (error) {
      setStatuses((current) => ({ ...current, [account.id]: error.message }));
    }
  };

  const savePassword = async (account) => {
    const password = passwordDrafts[account.id] || "";
    if (password.length < 12 || new TextEncoder().encode(password).length > 72) {
      setStatuses((current) => ({ ...current, [account.id]: "Use a password of 12–72 bytes." }));
      return;
    }
    setStatuses((current) => ({ ...current, [account.id]: "saving-password" }));
    try {
      await resetUserPassword(account.id, password);
      setPasswordDrafts((current) => ({ ...current, [account.id]: "" }));
      setStatuses((current) => ({ ...current, [account.id]: "Password reset" }));
    } catch (error) {
      setStatuses((current) => ({ ...current, [account.id]: error.message }));
    }
  };

  const saveAdminPassword = async (event) => {
    event.preventDefault();
    setAccountStatus("");
    setSavingAdminPassword(true);
    try {
      await changeAdminPassword(currentPassword, newAdminPassword);
      setCurrentPassword("");
      setNewAdminPassword("");
      setAccountStatus("Admin password updated and saved securely.");
    } catch (error) {
      setAccountStatus(error.message);
    } finally {
      setSavingAdminPassword(false);
    }
  };

  return (
    <main className="admin-dashboard">
      <header className="admin-dashboard-header">
        <div>
          <span className="admin-dashboard-kicker">WHITE STAR SHIPPING · ADMIN</span>
          <h1>Admin dashboard</h1>
          <p>Signed in as {user?.email}</p>
        </div>
        <div className="admin-header-actions">
          <button type="button" className="admin-button admin-button-dark" onClick={onCreateInvoice}>Create invoice</button>
          <button type="button" className="admin-button admin-button-light" onClick={onBack}>Back to workspace</button>
        </div>
      </header>

      <nav className="admin-tabs" aria-label="Admin sections">
        <button type="button" className={section === "invoices" ? "is-active" : ""} onClick={() => setSection("invoices")}>Invoices <span>{invoices.length}</span></button>
        <button type="button" className={section === "users" ? "is-active" : ""} onClick={() => setSection("users")}>Users <span>{users.length}</span></button>
        <button type="button" className={section === "account" ? "is-active" : ""} onClick={() => setSection("account")}>Admin account</button>
      </nav>

      {loadError && <div className="admin-alert" role="alert">{loadError} <button type="button" onClick={refresh}>Try again</button></div>}
      {loading ? <p className="admin-loading">Loading dashboard…</p> : section === "invoices" ? <section className="admin-card">
        <div className="admin-section-heading">
          <div><h2>All invoices</h2><p>Invoices from every user account.</p></div>
          <input aria-label="Search invoices" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search invoice, customer, or user" />
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Invoice</th><th>Customer</th><th>Owner</th><th>Updated</th><th>Total (INR)</th><th /></tr></thead>
            <tbody>
              {filteredInvoices.map((invoice) => <tr key={invoice.id}>
                <td>{invoice.form?.proformaNo || "Untitled invoice"}</td>
                <td>{invoice.form?.customerName || "—"}</td>
                <td>{invoice.owner?.email || "—"}</td>
                <td>{dateLabel(invoice.updatedAt)}</td>
                <td className="admin-money">₹ {money(invoiceTotal(invoice))}</td>
                <td><button type="button" className="admin-button admin-button-dark" onClick={() => onOpenInvoice(invoice.id)}>Open</button></td>
              </tr>)}
              {filteredInvoices.length === 0 && <tr><td colSpan="6" className="admin-empty">{invoices.length ? "No invoices match your search." : "No saved invoices yet."}</td></tr>}
            </tbody>
          </table>
        </div>
      </section> : section === "users" ? <section className="admin-card">
        <div className="admin-section-heading"><div><h2>User accounts</h2><p>Update a user’s email or reset their password. Passwords are never displayed.</p></div></div>
        <div className="admin-user-list">
          {users.map((account) => <article className="admin-user-card" key={account.id}>
            <div className="admin-user-meta"><strong>{account.email}</strong><span>Created {dateLabel(account.createdAt)}</span></div>
            <form className="admin-user-action" onSubmit={(event) => { event.preventDefault(); saveEmail(account); }}>
              <label><span>Email address</span><input type="email" required value={emailDrafts[account.id] || ""} onChange={(event) => setEmailDrafts((current) => ({ ...current, [account.id]: event.target.value }))} /></label>
              <button type="submit" className="admin-button admin-button-dark" disabled={statuses[account.id] === "saving-email"}>{statuses[account.id] === "saving-email" ? "Saving…" : "Update email"}</button>
            </form>
            <form className="admin-user-action" onSubmit={(event) => { event.preventDefault(); savePassword(account); }}>
              <label><span>New password</span><input type="password" autoComplete="new-password" minLength="12" value={passwordDrafts[account.id] || ""} onChange={(event) => setPasswordDrafts((current) => ({ ...current, [account.id]: event.target.value }))} placeholder="At least 12 characters" /></label>
              <button type="submit" className="admin-button admin-button-light" disabled={statuses[account.id] === "saving-password"}>{statuses[account.id] === "saving-password" ? "Saving…" : "Reset password"}</button>
            </form>
            {statuses[account.id] && !statuses[account.id].startsWith("saving-") && <p className={statuses[account.id].includes("updated") || statuses[account.id].includes("reset") ? "admin-user-status is-success" : "admin-user-status"} role="status">{statuses[account.id]}</p>}
          </article>)}
          {users.length === 0 && <p className="admin-empty">No user accounts are available to manage.</p>}
        </div>
      </section> : <section className="admin-card admin-account-card">
        <div className="admin-section-heading"><div><h2>Change admin password</h2><p>The new password will be hashed and saved to the database. Use it the next time you sign in.</p></div></div>
        <form className="admin-account-form" onSubmit={saveAdminPassword}>
          <label><span>Current password</span><input type="password" autoComplete="current-password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label>
          <label><span>New password</span><input type="password" autoComplete="new-password" minLength="12" maxLength="72" required value={newAdminPassword} onChange={(event) => setNewAdminPassword(event.target.value)} /></label>
          <button type="submit" className="admin-button admin-button-dark" disabled={savingAdminPassword}>{savingAdminPassword ? "Saving…" : "Update password"}</button>
        </form>
        {accountStatus && <p className={`admin-user-status ${accountStatus.startsWith("Admin password updated") ? "is-success" : ""}`} role="status">{accountStatus}</p>}
      </section>}
      <footer className="admin-dashboard-footer">Admin access is required for invoice and account management.</footer>
    </main>
  );
}
