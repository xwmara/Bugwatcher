import Navbar from "./components/Navbar";
import { ProjectPage } from "./pages/projectPage/ProjectPage";
import { BugPage } from "./pages/bugPage/BugPage";
import { AppProvider } from "./context/AppContext";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import Home from "./pages/homePage/Home";
import { BrowserRouter, Route, Routes } from "react-router-dom";

export default function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <AppProvider>
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/projects/:id" element={<ProjectPage />} />
              <Route path="/bugs/:id" element={<BugPage />} />
            </Routes>
          </AppProvider>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}
