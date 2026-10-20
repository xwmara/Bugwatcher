import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { api, getErrorMessage } from "../api/client";

export default function LoginModal({ onClose }) {
  const { loginUser } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post('/users/login', { email, password });
      loginUser(res.data);
      onClose();
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Email sau parolă incorecte.");
      } else {
        // e.g. the rate limit message, or no connection to the server
        setError(getErrorMessage(err, "A apărut o eroare la autentificare."));
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Autentificare</h2>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <form onSubmit={handleLogin} className="login-form">
          <label>Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />

          <label>Parolă</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />

          <button type="submit" className="add-btn">Login</button>
          <button type="button" className="cancel-btn" onClick={onClose}>Anulează</button>
        </form>
      </div>
    </div>
  );
}
