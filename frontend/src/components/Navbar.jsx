import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import LoginModal from "./LoginModal";
import RegisterModal from "./RegisterModal";
import TeamModal from "./TeamModal";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { user, logoutUser } = useContext(AuthContext);

  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showTeam, setShowTeam] = useState(false);
  const navigate = useNavigate();
  const handleClick = () => {
    navigate("/");
  }

  const handleLogout = async () => {
    await logoutUser();
    navigate("/");
  };

  return (
    <>
      <nav className="navbar">
        <h1 className="logo" onClick={() => handleClick()}>&lt;bugwatcher&gt;</h1>

        {!user ? (
          <div className="nav-actions">
            <button className="btn ghost" onClick={() => setShowRegister(true)}>Sign up</button>
            <button className="btn primary" onClick={() => setShowLogin(true)}>Log in</button>
          </div>
        ) : (
          <div className="nav-actions">
            <div style={{textAlign:'right', marginRight:8}}>
              <div style={{fontWeight:700}}>{user.email}</div>
              <div className="muted">{user.role}</div>
            </div>
            {user.role === "MP" && (
              <button className="btn ghost" onClick={() => setShowTeam(true)}>Team</button>
            )}
            <button className="btn ghost" onClick={handleLogout}>Log out</button>
          </div>
        )}
      </nav>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showRegister && <RegisterModal onClose={() => setShowRegister(false)} />}
      {showTeam && <TeamModal onClose={() => setShowTeam(false)} />}
    </>
  );
}
