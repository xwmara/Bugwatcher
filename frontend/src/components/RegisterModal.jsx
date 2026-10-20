import { useState, useId } from "react";
import { api, getErrorMessage } from "../api/client";

export default function RegisterModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("TST"); // default tester
  const [error, setError] = useState("");
  const id = useId(); // unique ids that link each <label> to its field

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    try {
      // axios throws for any non-2xx status, so reaching the next line means 201 Created
      await api.post("/users/register", { email, password, role });

      alert("Cont creat cu succes! Acum te poți loga.");
      onClose();
    } catch (err) {
      if (err.response?.status === 409) {
        setError("Acest email este deja folosit.");
      } else {
        // e.g. "Password too weak." or the rate limit message
        setError(getErrorMessage(err, "A apărut o eroare la înregistrare."));
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Înregistrare</h2>

        {error && <p role="alert" style={{ color: "red" }}>{error}</p>}

        <form onSubmit={handleRegister} className="register-form">
          <label htmlFor={`${id}-email`}>Email</label>
          <input
            id={`${id}-email`}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label htmlFor={`${id}-password`}>Parolă</label>
          <input
            id={`${id}-password`}
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <label htmlFor={`${id}-role`}>Rol</label>
          <select id={`${id}-role`} value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="MP">Membru proiect (MP)</option>
            <option value="TST">Tester (TST)</option>
          </select>

          <button type="submit" className="add-btn">
            Creează cont
          </button>
          <button type="button" className="cancel-btn" onClick={onClose}>
            Anulează
          </button>
        </form>
      </div>
    </div>
  );
}
