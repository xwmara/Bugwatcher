/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

// Short messages shown in a corner of the screen ("Bug reported.", "Could not join the project.").
// They replace alert(): they do not block the page and disappear after a few seconds.
const NOTICE_DURATION_MS = 4000;

export const NotificationContext = createContext({ notify: () => {} });

export const NotificationProvider = ({ children }) => {
  const [notices, setNotices] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => {
    setNotices((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // type: "success" or "error"
  const notify = useCallback((text, type = "success") => {
    const id = nextId.current++;
    setNotices((prev) => [...prev, { id, text, type }]);
    setTimeout(() => dismiss(id), NOTICE_DURATION_MS);
  }, [dismiss]);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {/* aria-live: screen readers read new messages aloud */}
      <div className="notices" aria-live="polite">
        {notices.map((n) => (
          <div key={n.id} className={`notice ${n.type}`} role={n.type === "error" ? "alert" : "status"}>
            <span>{n.text}</span>
            <button type="button" aria-label="Dismiss" onClick={() => dismiss(n.id)}>×</button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotify = () => useContext(NotificationContext).notify;
