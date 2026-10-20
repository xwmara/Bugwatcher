import { useState, useContext, useId } from "react";
import { AppContext } from "../context/AppContext";
import { useNotify } from "../context/NotificationContext";
import { api, getErrorMessage } from "../api/client";

export default function AddProjectModal({ onClose }) {
  const { fetchProjects } = useContext(AppContext);
  const notify = useNotify();

  const [name, setName] = useState("");
  const [repo, setRepo] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const id = useId(); // unique ids that link each <label> to its field

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
      notify(`Project "${name}" created.`);
      onClose();
    } catch (err) {
      // e.g. "Commit link must be an https:// link to GitHub, GitLab or Bitbucket."
      setError(getErrorMessage(err, "Could not create the project. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>New project</h2>

        {error && <p role="alert" className="form-error">{error}</p>}

        <form onSubmit={handleSubmit}>

          <label htmlFor={`${id}-name`}>Project name</label>
          <input
            id={`${id}-name`}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label htmlFor={`${id}-repo`}>Repository link (GitHub, GitLab or Bitbucket)</label>
          <input
            id={`${id}-repo`}
            type="text"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder="https://github.com/user/repository"
            required
          />

          <div className="modal-buttons">
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save project"}
            </button>
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
