import "../Style/invoice-home.css";

export default function InvoiceHome({ user, onViewInvoice, onCreateInvoice, onOpenAdmin }) {
  return (
    <main className="invoice-home">
      <header className="invoice-home-header">
        <span className="invoice-home-brand">IET LOGISTICS PRIVATE LTD</span>
        <span className="invoice-home-header-actions">
          {user?.role === "admin" && <button type="button" className="invoice-home-admin-link" onClick={onOpenAdmin}>Admin dashboard</button>}
          <span className="invoice-home-kicker">BILLING WORKSPACE</span>
        </span>
      </header>
      <section className="invoice-home-content" aria-label="Choose a workspace page">
        <button type="button" className="invoice-home-action" onClick={onViewInvoice}>
          <span className="invoice-home-action-copy">
            <small>EXISTING WORK</small>
            <strong>View Invoice</strong>
            <span>Open the current invoice preview</span>
          </span>
        </button>
        <button type="button" className="invoice-home-action invoice-home-action-primary" onClick={onCreateInvoice}>
          <span className="invoice-home-action-copy">
            <small>NEW WORK</small>
            <strong>Create Invoice</strong>
            <span>Start a new invoice</span>
          </span>
        </button>
      </section>
      <footer className="invoice-home-footer">IET LOGISTICS PRIVATE LTD</footer>
    </main>
  );
}
