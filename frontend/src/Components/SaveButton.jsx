import { useEffect, useState } from "react";

export default function SaveButton({ onSave, label = "Save changes", revision }) {
  const [status, setStatus] = useState("");

  useEffect(() => setStatus(""), [revision]);

  const save = async () => {
    setStatus("saving");
    try {
      await onSave();
      setStatus("saved");
    } catch (error) {
      console.error("Workspace data could not be saved.", error);
      setStatus("error");
    }
  };

  return (
    <span className="save-button-control">
      <button type="button" className="btn btn-primary" onClick={save} disabled={status === "saving"}>
        {status === "saving" ? "Saving…" : label}
      </button>
      {status === "saved" && <span className="save-button-status" role="status">Saved</span>}
      {status === "error" && <span className="save-button-status is-error" role="alert">Could not save. Try again.</span>}
    </span>
  );
}
