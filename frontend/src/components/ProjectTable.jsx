import { useContext } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

export default function ProjectTable() {
  const { projects, bugs, loading } = useContext(AppContext);
  const navigate = useNavigate();

  if (loading) {
    return <p>Se încarcă proiectele...</p>;
  }
  if (projects.length === 0) {
    return <p>Nu exista proiecte inregistrate.</p>;
  }

  const getBugCountForProject = (projectId) =>
    bugs.filter((b) => b.projectId === projectId).length;

  const handleProjectClick = (pid) => {
    navigate(`/projects/${pid}`)
  }


  return (
 
    <table className="project-table">
      <thead>
        <tr>
          <th>Nume proiect</th>
          <th>Commit link</th>
          <th>Owner</th>
          <th>Echipă</th>
          <th>Nr. bug-uri</th>
        </tr>
      </thead>
      <tbody>
        {projects.map((p) => (
          <tr key={p.id} onClick={() => handleProjectClick(p.id)} className="project-card">
            <td>{p.title}</td>
            <td>
              <a href={p.commit_link} target="_blank" rel="noreferrer">
                {p.commit_link}
              </a>
            </td>
            {/* Owner is a user (email) or a team (name) */}
            <td>{p.Owner?.email || p.Owner?.name || "—"}</td>
            <td>{p.Users?.map((u) => u.email).join(", ") || "—"}</td>
            <td>{getBugCountForProject(p.id)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
