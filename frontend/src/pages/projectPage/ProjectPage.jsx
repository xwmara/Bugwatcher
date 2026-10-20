import { api } from "../../api/client";
import { useContext, useState } from "react";
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom"

import './projectPage.css';
import { AppContext } from "../../context/AppContext";

export const ProjectPage = () => {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const { bugs } = useContext(AppContext);

    // Filter bugs for current project
    const projectBugs = bugs.filter(b => String(b.projectId) === String(id));

    useEffect(() => {
        const fetchProject = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/projects/${id}`);
                console.log("Fetched project:", res.data);
                if (res.status !== 200) {
                    console.error("Failed to fetch project");
                    setLoading(false);
                    return;
                }
                setProject(res.data);
            } catch (error) {
                console.error("Error fetching project:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchProject();
    }, [id]);

    if (loading) {
        return <div>Loading project...</div>;
    }
    if (!project) {
        return <div>Project not found.</div>;
    }
    
     return (
    <div className="project-page-container">
      <header className="project-header">
        <h1>{project.title}</h1>
        <p>{project.description || "Fără descriere..."}</p>
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
          <strong>Echipă:</strong> {project.Users?.map((m) => m.email).join(", ") || "—"}
        </p>
      </header>

      <section className="project-bugs">
        <h2>Bug-uri ({projectBugs.length})</h2>
        {projectBugs.length === 0 ? (
          <p>Nu există bug-uri raportate pentru acest proiect.</p>
        ) : (
          <table className="bug-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Reporter</th>
                <th>Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {projectBugs.map((b) => (
                <tr key={b.id}>
                  <td><Link to={`/bugs/${b.id}`}>{b.id}</Link></td>
                  <td><Link to={`/bugs/${b.id}`}>{b.title || b.description?.slice(0, 30) || "—"}</Link></td>
                  <td>{b.severity}</td>
                  <td>{b.status}</td>
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
