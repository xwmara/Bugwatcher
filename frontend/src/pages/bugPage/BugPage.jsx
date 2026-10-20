import { api } from "../../api/client";
import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "./bugPage.css";

export const BugPage = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);

  const [bug, setBug] = useState(null);
  const [project, setProject] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  useEffect(() => {
    const fetchBug = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/bugs/${id}`);
        setBug(res.data);

        // Fetch project to get team members
        const projRes = await api.get(`/projects/${res.data.projectId}`);
        setProject(projRes.data);

        // team members are MP users associated with project (only MPs can be assigned bugs)
        const mpMembers = (projRes.data.Users || []).filter(u => u.role === "MP");
        setTeamMembers(mpMembers);
      } catch (err) {
        console.error("Error fetching bug:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBug();
  }, [id]);

  const isOwner = () => {
    if (!project || !user) return false;
    if (project.owner_type === "USER" && project.owner_id === user.id) return true;
    // If team-owned, allow any team member to assign (or customize to team lead)
    if (project.owner_type === "TEAM" && user.teamId === project.owner_id) return true;
    return false;
  };

  const handleAssign = async () => {
    if (!selectedUserId) return;
    setAssigning(true);
    try {
      await api.put(`/bugs/${id}`, { assignedUserId: parseInt(selectedUserId, 10) });
      // refresh bug
      const res = await api.get(`/bugs/${id}`);
      setBug(res.data);
      alert("Bug assigned successfully.");
    } catch (err) {
      console.error("Error assigning bug:", err);
      alert("Failed to assign bug.");
    } finally {
      setAssigning(false);
    }
  };

  if (loading) return <div className="bug-page-container">Loading bug...</div>;
  if (!bug) return <div className="bug-page-container">Bug not found.</div>;

  return (
    <div className="bug-page-container">
      <Link className="back-link" to={`/projects/${bug.projectId}`}>← Back to project</Link>

      <header className="bug-header">
        <h1>{bug.title || `Bug #${bug.id}`}</h1>
        <div className="bug-meta">
          <span><strong>Severity:</strong> <span className={`badge severity-${bug.severity?.toLowerCase()}`}>{bug.severity}</span></span>
          <span><strong>Priority:</strong> <span className={`badge priority-${bug.priority?.toLowerCase()}`}>{bug.priority}</span></span>
          <span><strong>Status:</strong> <span className={`badge status-${bug.status?.toLowerCase()}`}>{bug.status}</span></span>
        </div>
        <div className="bug-meta">
          <span><strong>Reporter:</strong> {bug.reporter?.email || "—"}</span>
          <span><strong>Assigned:</strong> {bug.assignedUser?.email || "Unassigned"}</span>
        </div>
      </header>

      <section className="bug-description">
        <strong>Description</strong>
        <p>{bug.description || "No description provided."}</p>
      </section>

      {isOwner() && (
        <section className="assign-section">
          <h3>Assign Bug</h3>
          <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
            <option value="">-- Select team member --</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>{m.email} ({m.role})</option>
            ))}
          </select>
          <button className="btn primary" onClick={handleAssign} disabled={assigning || !selectedUserId}>
            {assigning ? "Assigning..." : "Assign"}
          </button>
        </section>
      )}
    </div>
  );
};
