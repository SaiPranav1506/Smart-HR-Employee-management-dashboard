import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authStorage } from "../../auth/storage";

export default function FloatingChatButton() {
  const location = useLocation();
  const navigate = useNavigate();

  const token = authStorage.getToken();
  const role = String(authStorage.getRole() || "").toLowerCase();

  const hide = useMemo(() => {
    const path = String(location?.pathname || "");
    if (!token) return true;
    if (!role) return true;
    if (path === "/" || path === "/login" || path === "/register" || path === "/reg") return true;
    if (path.startsWith("/chat")) return true;
    return false;
  }, [location, token, role]);

  if (hide) return null;

  return (
    <button
      type="button"
      className="floating-chat-btn"
      onClick={() => navigate("/chat")}
      aria-label="Open chat"
      title="Chat"
    >
      <svg
        className="floating-chat-btn__icon"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M12 3C6.477 3 2 6.91 2 11.75c0 2.56 1.257 4.86 3.28 6.44L4.5 21l3.52-1.34c1.18.37 2.52.59 3.98.59 5.523 0 10-3.91 10-8.75S17.523 3 12 3Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M7.5 12h9"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M7.5 9h6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
