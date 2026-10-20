/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../api/client";
import { AuthContext } from "./AuthContext";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bugs, setBugs] = useState([]);
  const { user } = useContext(AuthContext);
  const userId = user?.id;

  const addProject = (project) => {
    setProjects((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: project.name,
        repo: project.repo,
        owner: project.owner,
        team: project.team || [],
        testers: [],
        bugs: []
      }
    ]);
  };

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      console.log("Attempting to fetch projects...");
      const res = await api.get("/users/getUserProjects");
     
      if (res.status !== 200) {
        console.error("Failed to fetch projects");
        setLoading(false);
        return;
      }
      console.log("Projects fetched:", res.data.Projects);
      // Normalize response: backend may return either an array (TST) or a user object with Projects (MP)
      const payload = res.data.Projects;
      let projectsArray = [];
      if (Array.isArray(payload)) {
        projectsArray = payload;
      } else if (payload && Array.isArray(payload.Projects)) {
        projectsArray = payload.Projects;
      } else {
        projectsArray = [];
      }

      setProjects(projectsArray);
      // After loading projects, fetch bugs for each project to populate UI
      try {
        const bugsPromises = projectsArray.map((p) =>
          api.get(`/bugs/project/${p.id}`).then(r => r.data).catch(() => [])
        );
        const bugsArrays = await Promise.all(bugsPromises);
        const allBugs = bugsArrays.flat();
        setBugs(allBugs);
      } catch (errFetchBugs) {
        console.error("Error fetching bugs:", errFetchBugs);
      }
    } catch (err) {
      setProjects([]);
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load the projects of the logged-in user, and clear them on logout,
  // so the next user never sees the previous user's data.
  useEffect(() => {
    if (userId) {
      fetchProjects();
    } else {
      setProjects([]);
      setBugs([]);
      setLoading(false);
    }
  }, [userId, fetchProjects]);

  const addTesterToProject = (projectId, testerEmail) => {
    // Call backend to join project
    return api.post(`/projects/${projectId}/join`, {})
      .then((res) => {
        // optimistic update: add tester email locally
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId
              ? { ...p, testers: [...(p.testers || []), testerEmail] }
              : p
          )
        );
        return res;
      })
      .catch((err) => {
        console.error("Error joining project:", err);
        throw err;
      });
  };

  // 🔹 TST ➜ raportează bug
  const addBug = (bug) => {
    // Persist bug to backend
    return api.post("/bugs", {
      title: bug.title,
      description: bug.description,
      severity: bug.severity,
      priority: bug.priority,
      projectId: bug.projectId,
      commitLink: bug.commitLink
    })
      .then((res) => {
        const created = res.data;
        setBugs((prev) => [...prev, created]);
        setProjects((prev) =>
          prev.map((p) =>
            p.id === bug.projectId
              ? { ...p, bugs: [...(p.bugs || []), created.id] }
              : p
          )
        );
      })
      .catch((err) => {
        console.error("Error creating bug:", err);
        throw err;
      });
  };

  // 🔹 MP ➜ își alocă bug
  const assignBug = (bugId, userEmail) => {
    setBugs((prev) =>
      prev.map((b) =>
        b.id === bugId
          ? { ...b, assignedTo: userEmail, status: "In Progress" }
          : b
      )
    );
  };

  // 🔹 MP ➜ marchează rezolvat
  const resolveBug = (bugId, commitLink) => {
    setBugs((prev) =>
      prev.map((b) =>
        b.id === bugId
          ? { ...b, status: "Resolved", resolveCommit: commitLink }
          : b
      )
    );
  };

  return (
    <AppContext.Provider
      value={{
        projects,
        bugs,
        addProject,
        addTesterToProject,
        addBug,
        assignBug,
        resolveBug,
        fetchProjects,
        loading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
