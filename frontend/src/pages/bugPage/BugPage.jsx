import { api, getErrorMessage } from "../../api/client";
import { useContext, useEffect, useId, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { AppContext } from "../../context/AppContext";
import { STATUSES, STATUS_LABELS } from "../../constants/bugs";
import "./bugPage.css";

// Shows a commit link, or a dash when there is none
const CommitLink = ({ href }) =>
  href ? <a href={href} target="_blank" rel="noreferrer">{href}</a> : <span>—</span>;

export const BugPage = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const { fetchProjects } = useContext(AppContext);
  const fieldId = useId();

  const [bug, setBug] = useState(null);
  const [project, setProject] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState(null);

  const [selectedUserId, setSelectedUserId] = useState("");
  const [status, setStatus] = useState("");
  const [resolutionCommit, setResolutionCommit] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: "success" | "error", text }

  useEffect(() => {
    const fetchBug = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/bugs/${id}`);
        setBug(res.data);
        setStatus(res.data.status);
        setResolutionCommit(res.data.resolutionCommit || "");

        // Fetch project to get team members
        const projRes = await api.get(`/projects/${res.data.projectId}`);
        setProject(projRes.data);

        // team members are MP users associated with project (only MPs can be assigned bugs)
        const mpMembers = (projRes.data.Users || []).filter(u => u.role === "MP");
        setTeamMembers(mpMembers);
      } catch (err) {
        setBug(null);
        setErrorStatus(err.response?.status ?? "network");
      } finally {
        setLoading(false);
      }
    };
    setErrorStatus(null);
    fetchBug();
  }, [id]);

  const isOwner = () => {
    if (!project || !user) return false;
    if (project.owner_type === "USER" && project.owner_id === user.id) return true;
    // If team-owned, allow any team member to assign (or customize to team lead)
    if (project.owner_type === "TEAM" && user.teamId === project.owner_id) return true;
    return false;
  };

  // Sends the changes, reloads the bug and refreshes the lists on the home page
  const saveChanges = async (changes, successText) => {
    setSaving(true);
    setMessage(null);
    try {
      await api.put(`/bugs/${id}`, changes);
      const res = await api.get(`/bugs/${id}`);
      setBug(res.data);
      setStatus(res.data.status);
      setResolutionCommit(res.data.resolutionCommit || "");
      fetchProjects();
      setMessage({ type: "success", text: successText });
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err, "Could not save the changes. Please try again.") });
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = () => {
    if (!selectedUserId) return;
    saveChanges({ assignedUserId: parseInt(selectedUserId, 10) }, "Bug assigned.");
  };

  const handleStatusSave = (e) => {
    e.preventDefault();
    const changes = { status };
    if (status === "RESOLVED") changes.resolutionCommit = resolutionCommit;
    saveChanges(changes, `Status changed to "${STATUS_LABELS[status]}".`);
  };

  if (loading) return <div className="bug-page-container">Loading bug...</div>;
  if (errorStatus === 401) return <div className="bug-page-container">Please log in to see this bug.</div>;
  if (!bug) {
    return (
      <div className="bug-page-container">
        {errorStatus === 404 || errorStatus === 400 ? "Bug not found." : "Could not load the bug. Please try again."}
      </div>
    );
  }

  return (
    <div className="bug-page-container">
      <Link className="back-link" to={`/projects/${bug.projectId}`}>← Back to project</Link>

      <header className="bug-header">
        <h1>{bug.title || `Bug #${bug.id}`}</h1>
        <div className="bug-meta">
          <span><strong>Severity:</strong> <span className={`badge severity-${bug.severity?.toLowerCase()}`}>{bug.severity}</span></span>
          <span><strong>Priority:</strong> <span className={`badge priority-${bug.priority?.toLowerCase()}`}>{bug.priority}</span></span>
          <span><strong>Status:</strong> <span className={`badge status-${bug.status?.toLowerCase()}`}>{STATUS_LABELS[bug.status] || bug.status}</span></span>
        </div>
        <div className="bug-meta">
          <span><strong>Reporter:</strong> {bug.reporter?.email || "—"}</span>
          <span><strong>Assigned:</strong> {bug.assignedUser?.email || "Unassigned"}</span>
        </div>
        <div className="bug-links">
          <div><strong>Found in commit:</strong> <CommitLink href={bug.commitLink} /></div>
          <div><strong>Fixed in commit:</strong> <CommitLink href={bug.resolutionCommit} /></div>
        </div>
      </header>

      <section className="bug-description">
        <strong>Description</strong>
        <p>{bug.description || "No description provided."}</p>
      </section>

      {message && (
        <p className={`form-message ${message.type}`} role={message.type === "error" ? "alert" : "status"}>
          {message.text}
        </p>
      )}

      {isOwner() && (
        <>
          <section className="assign-section">
            <h3>Assign Bug</h3>
            <select aria-label="Team member" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
              <option value="">-- Select team member --</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.email} ({m.role})</option>
              ))}
            </select>
            <button className="btn primary" onClick={handleAssign} disabled={saving || !selectedUserId}>
              {saving ? "Saving..." : "Assign"}
            </button>
          </section>

          <form className="assign-section" onSubmit={handleStatusSave}>
            <h3>Status</h3>
            <label htmlFor={`${fieldId}-status`}>New status</label>
            <select id={`${fieldId}-status`} value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>

            {status === "RESOLVED" && (
              <div className="resolution-field">
                <label htmlFor={`${fieldId}-fix`}>Commit that fixed the bug</label>
                <input
                  id={`${fieldId}-fix`}
                  type="url"
                  required
                  value={resolutionCommit}
                  onChange={(e) => setResolutionCommit(e.target.value)}
                  placeholder="https://github.com/.../commit/..."
                />
              </div>
            )}

            <button className="btn primary" type="submit" disabled={saving || (status === bug.status && status !== "RESOLVED")}>
              {saving ? "Saving..." : "Save status"}
            </button>
          </form>
        </>
      )}
    </div>
  );
};
