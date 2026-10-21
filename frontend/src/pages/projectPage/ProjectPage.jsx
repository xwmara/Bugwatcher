import { api } from "../../api/client";
import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import './projectPage.css';
import { AppContext } from "../../context/AppContext";
import { STATUS_LABELS } from "../../constants/bugs";

export const ProjectPage = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState(null);
  const { bugs } = useContext(AppContext);

  // Filter bugs for current project
  const projectBugs = bugs.filter(b => String(b.projectId) === String(id));

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      setErrorStatus(null);
      try {
        const res = await api.get(`/projects/${id}`);
        setProject(res.data);
      } catch (error) {
        setProject(null);
        setErrorStatus(error.response?.status ?? "network");
      } finally {
        setLoading(false);
      }
    }
    fetchProject();
  }, [id]);

  if (loading) {
    return <div className="project-page-container">Loading project...</div>;
  }
  if (errorStatus === 401) {
    return <div className="project-page-container">Please log in to see this project.</div>;
  }
  if (!project) {
    return (
      <div className="project-page-container">
        {errorStatus === 404 || errorStatus === 400 ? "Project not found." : "Could not load the project. Please try again."}
      </div>
    );
  }

  return (
    <div className="project-page-container">
      <header className="project-header">
        <h1>{project.title}</h1>
        <p>{project.description || "No description."}</p>
        <p>
          <strong>Owner: </strong> {project.Owner?.email || project.Owner?.name || "—"}
        </p>
        <p>
          <strong>Repository: </strong>{" "}
          <a href={project.commit_link} target="_blank" rel="noreferrer">
            {project.commit_link}
          </a>
        </p>
        <p>
          <strong>Members:</strong> {project.Users?.map((m) => m.email).join(", ") || "—"}
        </p>
      </header>

      <section className="project-bugs">
        <h2>Bugs ({projectBugs.length})</h2>
        {projectBugs.length === 0 ? (
          <p>No bugs have been reported for this project yet.</p>
        ) : (
          <table className="bug-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Reporter</th>
                <th>Assigned to</th>
              </tr>
            </thead>
            <tbody>
              {projectBugs.map((b) => (
                <tr key={b.id}>
                  <td><Link to={`/bugs/${b.id}`}>{b.id}</Link></td>
                  <td><Link to={`/bugs/${b.id}`}>{b.title || b.description?.slice(0, 30) || "—"}</Link></td>
                  <td>{b.severity}</td>
                  <td>{STATUS_LABELS[b.status] || b.status}</td>
                  <td>{b.reporter?.email || "—"}</td>
                  <td>{b.assignedUser?.email || "Unassigned"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};
