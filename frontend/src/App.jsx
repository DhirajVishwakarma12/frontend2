import { useCallback, useEffect, useState } from "react";
import ProformaInvoice from "./Components/ProformaInvoice.jsx";
import Animation from "./pages/animation.jsx";
import InvoiceHome from "./Components/InvoiceHome.jsx";
import LoginPage from "./Components/LoginPage.jsx";
import AdminDashboard from "./Components/AdminDashboard.jsx";
import { getCurrentUser, signIn, signOut } from "./services/auth.js";
import { preloadWorkspaceData } from "./services/workspaceData.js";

function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [invoiceMode, setInvoiceMode] = useState(null);
  const [invoiceId, setInvoiceId] = useState(null);
  const [adminDashboardOpen, setAdminDashboardOpen] = useState(false);
  const [returnToAdminDashboard, setReturnToAdminDashboard] = useState(false);
  const finishIntro = useCallback(() => setShowIntro(false), []);
  const title = "Proforma Invoice | IET LOGISTICS PRIVATE LTD";
  const description = "Review, edit, and print proforma invoices from IET LOGISTICS PRIVATE LTD.";

  useEffect(() => {
    if (showIntro) return undefined;
    let active = true;
    getCurrentUser()
      .then(async ({ user }) => {
        try {
          await preloadWorkspaceData(user.id);
        } catch (error) {
          console.error("Workspace data could not be preloaded.", error);
        }
        if (active) {
          setCurrentUser(user);
          setIsLoggedIn(true);
          setAdminDashboardOpen(user.role === "admin");
        }
      })
      .catch(() => { if (active) { setCurrentUser(null); setIsLoggedIn(false); } })
      .finally(() => { if (active) setAuthChecked(true); });
    return () => { active = false; };
  }, [showIntro]);

  const handleLogin = async (email, password) => {
    const { user } = await signIn(email, password);
    try {
      await preloadWorkspaceData(user.id);
    } catch (error) {
      console.error("Workspace data could not be preloaded.", error);
    }
    setCurrentUser(user);
    setIsLoggedIn(true);
    setInvoiceMode(null);
    setInvoiceId(null);
    setAdminDashboardOpen(user.role === "admin");
  };

  const handleLogout = async () => {
    await signOut();
    setIsLoggedIn(false);
    setCurrentUser(null);
    setInvoiceMode(null);
    setInvoiceId(null);
    setAdminDashboardOpen(false);
    setReturnToAdminDashboard(false);
  };

  const openInvoice = (mode) => {
    setInvoiceId(null);
    setInvoiceMode(mode);
  };

  const closeInvoice = () => {
    setInvoiceId(null);
    setInvoiceMode(null);
    if (returnToAdminDashboard) {
      setReturnToAdminDashboard(false);
      setAdminDashboardOpen(true);
    }
  };

  const openAdminInvoice = (id) => {
    setReturnToAdminDashboard(true);
    setAdminDashboardOpen(false);
    setInvoiceId(id);
    setInvoiceMode("view");
  };

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="IET LOGISTICS PRIVATE LTD" />
      <meta
        property="og:url"
        content={typeof window === "undefined" ? "" : window.location.href}
      />
      {showIntro ? <Animation onComplete={finishIntro} /> : !authChecked ? <main className="login-page" aria-live="polite">Checking sign-in…</main> : isLoggedIn ? adminDashboardOpen && currentUser?.role === "admin" ? <AdminDashboard user={currentUser} onLogout={handleLogout} onOpenInvoice={openAdminInvoice} /> : invoiceMode ? <ProformaInvoice key={`${invoiceMode}-${currentUser?.id}-${invoiceId || "new"}`} user={currentUser} mode={invoiceMode} invoiceId={invoiceId} onHome={closeInvoice} onLogout={handleLogout} /> : <InvoiceHome user={currentUser} onOpenAdmin={() => setAdminDashboardOpen(true)} onViewInvoice={() => openInvoice("view")} onCreateInvoice={() => openInvoice("create")} /> : <LoginPage onLogin={handleLogin} />}
    </>
  );
}

export default App;
