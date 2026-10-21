import { useContext, useState, useEffect, useId, type FormEvent } from "react";
import { api, getErrorMessage } from "../api/client";
import { AuthContext } from "../context/AuthContext";
import type { Team, User } from "../types";

// GET /teams/my answers with the team, or with { team: null } when the user has none
type MyTeamResponse = Team | { team: null };
const toTeam = (data: MyTeamResponse): Team | null => ("id" in data ? data : null);

interface Message {
  type: "success" | "error";
  text: string;
}

export default function TeamModal({ onClose }: { onClose: () => void }) {
  const { setUser } = useContext(AuthContext);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const id = useId(); // unique ids that link each <label> to its field

  useEffect(() => {
    const fetchTeam = async () => {
      setLoading(true);
      try {
        const res = await api.get<MyTeamResponse>("/teams/my");
        setTeam(toTeam(res.data));
      } catch (err) {
        console.error("Error fetching team:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, []);

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    setCreating(true);
    try {
      await api.post("/teams", { name: teamName, description: teamDesc });
      // Refresh user info so teamId is set in context
      const userRes = await api.get<User>("/users/me");
      if (userRes.data && setUser) setUser(userRes.data);
      // Refresh team data to get full team with Users
      const teamRes = await api.get<MyTeamResponse>("/teams/my");
      setTeam(toTeam(teamRes.data));
      setMessage({ type: "success", text: "Team created." });
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err, "Could not create the team.") });
    } finally {
      setCreating(false);
    }
  };

  const handleInvite = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    setInviting(true);
    try {
      await api.post("/teams/invite", { email: inviteEmail });
      setMessage({ type: "success", text: `${inviteEmail} joined the team.` });
      setInviteEmail("");
      // Refresh team members
      const res = await api.get<MyTeamResponse>("/teams/my");
      setTeam(toTeam(res.data));
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err, "Could not invite this user.") });
    } finally {
      setInviting(false);
    }
  };

  if (loading) return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <p>Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Team</h2>

        {message && (
          <p className={message.type === "error" ? "form-error" : "form-success"} role={message.type === "error" ? "alert" : "status"}>
            {message.text}
          </p>
        )}

        {!team ? (
          <form onSubmit={handleCreate}>
            <p>You are not in a team yet. Projects you create while in a team belong to the whole team.</p>
            <label htmlFor={`${id}-name`}>Team name</label>
            <input
              id={`${id}-name`}
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
            <label htmlFor={`${id}-description`}>Description (optional)</label>
            <input
              id={`${id}-description`}
              type="text"
              value={teamDesc}
              onChange={(e) => setTeamDesc(e.target.value)}
            />
            <button className="btn primary" type="submit" disabled={creating} style={{ marginTop: "0.5rem" }}>
              {creating ? "Creating..." : "Create team"}
            </button>
          </form>
        ) : (
          <div>
            <h3>{team.name}</h3>
            <p className="muted">{team.description || "No description."}</p>

            <h4 style={{ marginTop: "1rem" }}>Members</h4>
            {team.Users && team.Users.length > 0 ? (
              <ul>
                {team.Users.map((u) => (
                  <li key={u.id}>{u.email} ({u.role})</li>
                ))}
              </ul>
            ) : (
              <p>No members.</p>
            )}

            <form onSubmit={handleInvite}>
              <label htmlFor={`${id}-invite`} style={{ marginTop: "1rem", display: "block" }}>Add a project member (MP) by email</label>
              <input
                id={`${id}-invite`}
                type="email"
                required
                placeholder="name@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <button className="btn primary" type="submit" disabled={inviting} style={{ marginLeft: "0.5rem" }}>
                {inviting ? "Adding..." : "Add"}
              </button>
            </form>
          </div>
        )}

        <button className="btn ghost" onClick={onClose} style={{ marginTop: "1rem" }}>Close</button>
      </div>
    </div>
  );
}
