import { useState, useId, type FormEvent } from "react";
import { api, getErrorMessage, getErrorStatus } from "../api/client";
import type { Role } from "../types";
import { useNotify } from "../context/NotificationContext";

export default function RegisterModal({ onClose }: { onClose: () => void }) {
  const notify = useNotify();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("TST"); // default tester
  const [error, setError] = useState("");
  const id = useId(); // unique ids that link each <label> to its field

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    try {
      // axios throws for any non-2xx status, so reaching the next line means 201 Created
      await api.post("/users/register", { email, password, role });

      notify("Account created. You can now log in.");
      onClose();
    } catch (err) {
      if (getErrorStatus(err) === 409) {
        setError("This email is already registered.");
      } else {
        // e.g. "Password too weak." or the rate limit message
        setError(getErrorMessage(err, "Could not create the account. Please try again."));
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Create an account</h2>

        {error && <p role="alert" className="form-error">{error}</p>}

        <form onSubmit={handleRegister} className="register-form">
          <label htmlFor={`${id}-email`}>Email</label>
          <input
            id={`${id}-email`}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label htmlFor={`${id}-password`}>Password</label>
          <input
            id={`${id}-password`}
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <label htmlFor={`${id}-role`}>Role</label>
          <select id={`${id}-role`} value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="MP">Project member (MP)</option>
            <option value="TST">Tester (TST)</option>
          </select>

          <button type="submit" className="add-btn">
            Create account
          </button>
          <button type="button" className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
