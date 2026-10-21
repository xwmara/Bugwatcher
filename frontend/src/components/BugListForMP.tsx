import { useContext } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { AuthContext } from "../context/AuthContext";
import { SEVERITY_RANK, STATUS_LABELS } from "../constants/bugs";

// MP home page: the bugs assigned to the logged-in user that still need work
// (closed bugs are hidden), most severe first.
export default function BugListForMP() {
  const { projects, bugs, loading } = useContext(AppContext);
  const { user } = useContext(AuthContext);

  if (loading || !user) return null;

  const myBugs = bugs
    .filter((b) => b.assignedUserId === user.id && b.status !== "CLOSED")
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);

  const getProjectTitle = (projectId: number) =>
    projects.find((p) => p.id === projectId)?.title || "—";

  return (
    <section className="bug-list-mp" aria-labelledby="my-bugs-title">
      <h3 id="my-bugs-title">Bugs assigned to me ({myBugs.length})</h3>

      {myBugs.length === 0 ? (
        <p className="muted">No open bugs are assigned to you.</p>
      ) : (
        <table className="bug-table">
          <thead>
            <tr>
              <th>Bug</th>
              <th>Project</th>
              <th>Severity</th>
              <th>Priority</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {myBugs.map((b) => (
              <tr key={b.id}>
                <td><Link to={`/bugs/${b.id}`}>{b.title}</Link></td>
                <td>{getProjectTitle(b.projectId)}</td>
                <td><span className={`badge severity-${b.severity.toLowerCase()}`}>{b.severity}</span></td>
                <td>{b.priority}</td>
                <td><span className={`badge status-${b.status.toLowerCase()}`}>{STATUS_LABELS[b.status]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
