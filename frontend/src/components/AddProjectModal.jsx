import { useState, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { AuthContext } from "../context/AuthContext";
import { api } from "../api/client";

export default function AddProjectModal({ onClose }) {
  const { addProject } = useContext(AppContext);
  const { user } = useContext(AuthContext);

  const [name, setName] = useState("");
  const [repo, setRepo] = useState("");
  const [teamInput, setTeamInput] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // const team = teamInput.split(",").map(t => t.trim());
    // const team = req.user.team
    
    const res = await api.post("/projects", {
        title: name,
        commit_link: repo
      })

    console.log(res);
    if (!res.data) {
      alert("A apărut o eroare la crearea proiectului.");
      return;
    }

    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Adaugă proiect</h2>

        <form onSubmit={handleSubmit}>
          
          <label>Nume proiect</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label>Commit URL</label>
          <input
            type="text"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            required
          />

          {/* <label>Echipa (separate prin virgulă)</label>
          <input
            type="text"
            value={teamInput}
            onChange={(e) => setTeamInput(e.target.value)}
            placeholder="ex: Mara, Andrei, Ioana"
            required
          /> */}

          <div className="modal-buttons">
    <button onClick={handleSubmit}>Salvează proiect</button>
    <button className="cancel-btn" onClick={onClose}>Anulează</button>
</div>


         
        </form>
      </div>
    </div>
  );
}
