import { useState, useContext, useId, type FormEvent } from "react";
import { AppContext } from "../context/AppContext";
import { useNotify } from "../context/NotificationContext";
import { getErrorMessage } from "../api/client";
import type { Priority, Severity } from "../types";

interface AddBugModalProps {
  projectId: number;
  onClose: () => void;
}

export default function AddBugModal({ projectId, onClose }: AddBugModalProps) {
  const { addBug } = useContext(AppContext);
  const notify = useNotify();

  const [severity, setSeverity] = useState<Severity>("Low");
  const [priority, setPriority] = useState<Priority>("Low");
  const [description, setDescription] = useState("");
  const [commitLink, setCommitLink] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const id = useId(); // unique ids that link each <label> to its field

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await addBug({
        title,
        projectId,
        severity,
        priority,
        description,
        commitLink,
      });
      notify("Bug reported. Thank you!");
      onClose();
    } catch (err) {
      // e.g. "Commit link must be an https:// link to GitHub, GitLab or Bitbucket."
      setError(getErrorMessage(err, "Could not report the bug. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Report a bug</h2>

        {error && <p role="alert" className="form-error">{error}</p>}

        <form onSubmit={handleSubmit} className="bug-form">

          <label htmlFor={`${id}-title`}>Title</label>
          <input
            id={`${id}-title`}
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Short summary of the bug"
          />

          <label htmlFor={`${id}-severity`}>Severity</label>
          <select id={`${id}-severity`} value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Critical</option>
          </select>

          <label htmlFor={`${id}-priority`}>Priority</label>
          <select id={`${id}-priority`} value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>

          <label htmlFor={`${id}-description`}>Description</label>
          <textarea
            id={`${id}-description`}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Steps to reproduce, what you expected, what happened..."
          />

          <label htmlFor={`${id}-commit`}>Related commit link (optional)</label>
          <input
            id={`${id}-commit`}
            type="text"
            value={commitLink}
            onChange={(e) => setCommitLink(e.target.value)}
            placeholder="https://github.com/.../commit/123"
          />

          <div style={{display:'flex', gap:8, marginTop:6}}>
            <button className="btn primary" type="submit" disabled={saving}>
              {saving ? "Sending..." : "Send bug report"}
            </button>
            <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
