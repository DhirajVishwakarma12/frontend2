import { useCallback, useState } from "react";
import ProformaInvoice from "./Components/ProformaInvoice.jsx";
import Animation from "./pages/animation.jsx";

function App() {
  const [showIntro, setShowIntro] = useState(true);
  const finishIntro = useCallback(() => setShowIntro(false), []);
  const title = "Proforma Invoice | White Star Shipping";
  const description = "Review, edit, and print proforma invoices from White Star Shipping.";

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="White Star Shipping" />
      <meta
        property="og:url"
        content={typeof window === "undefined" ? "" : window.location.href}
      />
      {showIntro ? <Animation onComplete={finishIntro} /> : <ProformaInvoice />}
    </>
  );
}

export default App;
