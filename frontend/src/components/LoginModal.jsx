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
        setError("Incorrect email or password.");
      } else {
        // e.g. the rate limit message, or no connection to the server
        setError(getErrorMessage(err, "Could not log in. Please try again."));
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Log in</h2>

        {error && <p role="alert" className="form-error">{error}</p>}

        <form onSubmit={handleLogin} className="login-form">
          <label htmlFor={`${id}-email`}>Email</label>
          <input id={`${id}-email`} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />

          <label htmlFor={`${id}-password`}>Password</label>
          <input id={`${id}-password`} type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />

          <button type="submit" className="add-btn">Log in</button>
          <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
        </form>
      </div>
    </div>
  );
}
