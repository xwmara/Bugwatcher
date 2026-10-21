import { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { AuthContext } from "../context/AuthContext";
import { useNotify } from "../context/NotificationContext";
import { getErrorMessage } from "../api/client";
import AddBugModal from "./AddBugModal";

export default function ProjectsListForTester() {
  const { projects, addTesterToProject, bugs } = useContext(AppContext);
  const { user } = useContext(AuthContext);
  const notify = useNotify();

  const [selectedProjectId, setSelectedProjectId] = useState(null);
  if (projects.length === 0) {
    return <p>There are no projects yet. Please check back later.</p>;
  }

  const handleJoin = (project) => {
    addTesterToProject(project.id, user.email)
      .then(() => {
        notify(`You joined "${project.title}" as a tester.`);
      })
      .catch((err) => {
        notify(getErrorMessage(err, "Could not join the project. Please try again."), "error");
      });
  };

  const getBugCountForProject = (projectId) =>
    bugs.filter((b) => b.projectId === projectId).length;

  return (
    <div className="tester-project-list">

      <div className="tester-project-grid">
        {projects.map((p) => {
          const isTester = p.testers?.includes(user.email);
          const bugCount = getBugCountForProject(p.id);

          return (
            <div key={p.id} className="tester-project-card">
              <h4>{p.title}</h4>
              <p><strong>Repository:</strong> {p.commit_link}</p>
              <p><strong>Owner:</strong> {p.Owner?.email || p.Owner?.name || "—"}</p>
              <p><strong>Testers:</strong> {p.testers?.length || 0}</p>
              <p><strong>Bugs:</strong> {bugCount}</p>

              {isTester ? (
                <>
                  <span className="tester-badge">You are a tester on this project</span>
                  <button className="btn primary" onClick={() => setSelectedProjectId(p.id)}>
                    Report a bug
                  </button>
                </>
              ) : (
                <>
                  <button className="btn primary" onClick={() => handleJoin(p)}>
                    Join as tester
                  </button>
                  <p className="muted">Join the project to report bugs.</p>
                </>
              )}
            </div>
          );
        })}
      </div>

      {selectedProjectId && (
        <AddBugModal
          projectId={selectedProjectId}
          onClose={() => setSelectedProjectId(null)}
        />
      )}
    </div>
  );
}
