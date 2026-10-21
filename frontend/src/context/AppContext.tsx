/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "../api/client";
import { AuthContext } from "./AuthContext";
import type { Bug, NewBug, Project } from "../types";

interface AppContextValue {
  projects: Project[];
  bugs: Bug[]; // bugs of all the projects in `projects`
  loading: boolean;
  fetchProjects: () => Promise<void>;
  addTesterToProject: (projectId: number, testerEmail: string) => Promise<void>;
  addBug: (bug: NewBug) => Promise<void>;
}

// The default value is only used outside an AppProvider (e.g. in some tests)
export const AppContext = createContext<AppContextValue>({
  projects: [],
  bugs: [],
  loading: false,
  fetchProjects: async () => {},
  addTesterToProject: async () => {},
  addBug: async () => {},
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const { user } = useContext(AuthContext);
  const userId = user?.id;

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ Projects: Project[] }>("/users/getUserProjects");
      const projectsArray = Array.isArray(res.data.Projects) ? res.data.Projects : [];
      setProjects(projectsArray);

      // Then load the bugs of every project (a failed request counts as "no bugs")
      const bugsArrays = await Promise.all(
        projectsArray.map((p) =>
          api.get<Bug[]>(`/bugs/project/${p.id}`).then((r) => r.data).catch(() => [] as Bug[])
        )
      );
      setBugs(bugsArrays.flat());
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

  // A tester joins a project; the list is updated right away
  const addTesterToProject = async (projectId: number, testerEmail: string) => {
    await api.post(`/projects/${projectId}/join`, {});
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, testers: [...(p.testers || []), testerEmail] } : p
      )
    );
  };

  // A tester reports a bug (errors are passed on to the caller, which shows them)
  const addBug = async (bug: NewBug) => {
    const res = await api.post<Bug>("/bugs", bug);
    setBugs((prev) => [...prev, res.data]);
  };

  return (
    <AppContext.Provider value={{ projects, bugs, loading, fetchProjects, addTesterToProject, addBug }}>
      {children}
    </AppContext.Provider>
  );
};
