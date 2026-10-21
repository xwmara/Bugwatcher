/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

// Short messages shown in a corner of the screen ("Bug reported.", "Could not join the project.").
// They replace alert(): they do not block the page and disappear after a few seconds.
const NOTICE_DURATION_MS = 4000;

export type NoticeType = "success" | "error";

interface Notice {
  id: number;
  text: string;
  type: NoticeType;
}

interface NotificationContextValue {
  notify: (text: string, type?: NoticeType) => void;
}

export const NotificationContext = createContext<NotificationContextValue>({ notify: () => {} });

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setNotices((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notify = useCallback((text: string, type: NoticeType = "success") => {
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
