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

  //  User NEAUTENTIFICAT
  if (!user) {
    return (
      <div className="not-logged">
        <h2>Creează un cont sau autentifică-te pentru a vedea proiectele.</h2>
      </div>
    );
  }

  // MP — Membru de proiect
  if (user.role === "MP") {
    return (
      <div className="mp-dashboard">

        <ProjectTable />

        <button
          className="add-btn"
          onClick={() => setShowAddProject(true)}
        >
          Adaugă proiect
        </button>

        {showAddProject && (
          <AddProjectModal onClose={() => setShowAddProject(false)} />
        )}

        <BugListForMP />
      </div>
    );
  }

  // TST — Tester
  if (user.role === "TST") {
    return (
      <div className="tst-dashboard">
        <h2>Proiecte disponibile</h2>
        <ProjectsListForTester />
      </div>
    );
  }


  return null;
}
