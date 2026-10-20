import { useState, useContext, useId } from "react";
import { AuthContext } from "../context/AuthContext";
import { api, getErrorMessage } from "../api/client";

export default function LoginModal({ onClose }) {
  const { loginUser } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const id = useId(); // unique ids that link each <label> to its field

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

        {error && <p role="alert" style={{ color: "red" }}>{error}</p>}

        <form onSubmit={handleLogin} className="login-form">
          <label htmlFor={`${id}-email`}>Email</label>
          <input id={`${id}-email`} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />

          <label htmlFor={`${id}-password`}>Parolă</label>
          <input id={`${id}-password`} type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />

          <button type="submit" className="add-btn">Login</button>
          <button type="button" className="cancel-btn" onClick={onClose}>Anulează</button>
        </form>
      </div>
    </div>
  );
}
