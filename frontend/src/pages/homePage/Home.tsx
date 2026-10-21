import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import AddProjectModal from "../../components/AddProjectModal";
import ProjectTable from "../../components/ProjectTable";
import ProjectsListForTester from "../../components/ProjectsListForTester";
import BugListForMP from "../../components/BugListForMP";
import './home.css';

export default function Home() {
  const { user } = useContext(AuthContext);
  const [showAddProject, setShowAddProject] = useState(false);

  // Not logged in
  if (!user) {
    return (
      <div className="not-logged">
        <h2>Track bugs across your team&apos;s projects.</h2>
        <p className="muted">Log in or create an account to see your projects.</p>
      </div>
    );
  }

  // MP: project member
  if (user.role === "MP") {
    return (
      <div className="mp-dashboard">

        <ProjectTable />

        <button
          className="add-btn"
          onClick={() => setShowAddProject(true)}
        >
          New project
        </button>

        {showAddProject && (
          <AddProjectModal onClose={() => setShowAddProject(false)} />
        )}

        <BugListForMP />
      </div>
    );
  }

  // TST: tester
  if (user.role === "TST") {
    return (
      <div className="tst-dashboard">
        <h2>Available projects</h2>
        <ProjectsListForTester />
      </div>
    );
  }

  return null;
}
