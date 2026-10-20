import { useState, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { api, getErrorMessage } from "../api/client";

export default function AddProjectModal({ onClose }) {
  const { fetchProjects } = useContext(AppContext);

  const [name, setName] = useState("");
  const [repo, setRepo] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/projects", {
        title: name,
        commit_link: repo
      });
      // Reload the list so the new project appears without a page refresh
      await fetchProjects();
      onClose();
    } catch (err) {
      // e.g. "Invalid commit link." or "Commit link unreachable."
      setError(getErrorMessage(err, "A apărut o eroare la crearea proiectului."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Adaugă proiect</h2>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <form onSubmit={handleSubmit}>

          <label>Nume proiect</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label>Commit URL</label>
          <input
            type="text"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            required
          />

          <div className="modal-buttons">
            <button type="submit" disabled={saving}>
              {saving ? "Se salvează..." : "Salvează proiect"}
            </button>
            <button type="button" className="cancel-btn" onClick={onClose}>Anulează</button>
          </div>
        </form>
      </div>
    </div>
  );
}
