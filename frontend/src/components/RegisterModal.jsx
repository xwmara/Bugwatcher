import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { api } from "../api/client";

export default function RegisterModal({ onClose }) {
  const { registerUser } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("TST"); // default tester
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      
      const res = await api.post("/users/register", {
        email,
        password,
        role
        
      })

      if (!res.data.success) {
        setError("Acest email este deja folosit.");
        return;
      }

      alert("Cont creat cu succes! Acum te poți loga.");
      onClose();
    } catch (error) {
      setError("A apărut o eroare la înregistrare.");
    
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Înregistrare</h2>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <form onSubmit={handleRegister} className="register-form">
          <label>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Parolă</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <label>Rol</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
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
