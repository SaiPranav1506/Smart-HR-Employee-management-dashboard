import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { NavLink, useNavigate } from "react-router-dom";
import { authStorage } from "../../auth/storage";
import siteLogo from "../../assets/smart-hr-employee-logo.svg";

import { API_BASE_URL } from "../../api/client";

const TopNav = ({ title, links = [] }) => {
  const navigate = useNavigate();
  const email = authStorage.getEmail();
  const role = (authStorage.getRole() || "").toLowerCase();
  const token = authStorage.getToken();

  const [notiOpen, setNotiOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const popoverRef = useRef(null);

  const logout = () => {
    authStorage.clear();
    navigate("/");
  };

  const effectiveLinks = useMemo(() => {
    if (links && links.length > 0) return links;
    if (role !== "hr") return [];
    return [
      { to: "/hr-dashboard", label: "Dashboard 🏠" },
      { to: "/hr/book-cab", label: "Book cab 🚕" },
      { to: "/hr/my-bookings", label: "Bookings 📅" },
      { to: "/hr/assign-work", label: "Assign work 📝" },
      { to: "/hr/my-assignments", label: "Assignments 📋" },
      { to: "/hr/my-employees", label: "Employees 👥" },
    ];
  }, [links, role]);

  const refreshNotifications = async () => {
    if (role !== "hr") return;
    if (!token || !email) return;

    try {
      const [listRes, countRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/hr/notifications?email=${email}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/api/hr/notifications/unread-count?email=${email}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setNotifications(listRes.data || []);
      setUnreadCount(typeof countRes.data === "number" ? countRes.data : 0);
    } catch (e) {
      console.error("Failed to load notifications", e);
    }
  };

  const markRead = async (id) => {
    if (!token) return;
    try {
      await axios.put(`${API_BASE_URL}/api/hr/notifications/${id}/read`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await refreshNotifications();
    } catch (e) {
      console.error("Failed to mark read", e);
    }
  };

  useEffect(() => {
    if (role !== "hr") return;
    refreshNotifications();
    const id = setInterval(() => refreshNotifications(), 10000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, token, email]);

  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (!notiOpen) return;
      const el = popoverRef.current;
      if (!el) return;
      if (!el.contains(e.target)) setNotiOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [notiOpen]);

  return (
    <div className="topNav">
      <div className="topNavInner">
        <div className="navLeft">
          <div>
            <div className="navBrand">
              <img className="siteLogo" src={siteLogo} alt="Smart HR- Employee" />
              <span>{title}</span>
            </div>
          </div>
        </div>

        <div className="navLinks">
          {effectiveLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => (isActive ? "navLink navLinkActive" : "navLink")}
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="navRight">
          {email && <span className="navPill">{email}</span>}
          {role && <span className="navPill">{role.toUpperCase()}</span>}

          <NavLink
            to="/chat"
            className="navIconBtn"
            aria-label="Chat"
            title="Chat"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M20 3H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h3v3a1 1 0 0 0 1.6.8L13.8 18H20a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm0 13h-6.6a1 1 0 0 0-.6.2L9 19v-2a1 1 0 0 0-1-1H4V5h16v11Z"
                fill="currentColor"
                opacity="0.9"
              />
              <path d="M7 9h10v2H7V9Zm0-3h10v2H7V6Zm0 6h7v2H7v-2Z" fill="currentColor" opacity="0.6" />
            </svg>
          </NavLink>

          {role === "hr" && (
            <div className="navIconWrap" ref={popoverRef}>
              <button
                type="button"
                className="navIconBtn"
                aria-label="Notifications"
                onClick={() => {
                  const next = !notiOpen;
                  setNotiOpen(next);
                  if (next) refreshNotifications();
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2Zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2Z"
                    fill="currentColor"
                    opacity="0.9"
                  />
                </svg>
              </button>
              {unreadCount > 0 && <span className="navUnreadDot" />}

              {notiOpen && (
                <div className="navPopover">
                  <div className="navPopoverCard">
                    <div className="navPopoverInner">
                      <div className="navPopoverHeader">
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ fontWeight: 950, color: "var(--gold)" }}>Notifications</div>
                          <span className="badge badgeGold">Unread: {unreadCount}</span>
                        </div>
                        <button type="button" className="btnGhost" onClick={refreshNotifications}>
                          Refresh
                        </button>
                      </div>

                      {notifications.length === 0 ? (
                        <div className="subtle" style={{ marginTop: 10 }}>No notifications yet.</div>
                      ) : (
                        <div className="navList">
                          {notifications.slice(0, 8).map((n) => (
                            <div
                              key={n.id}
                              className={n.readFlag ? "navNotifRow" : "navNotifRow navNotifRowUnread"}
                            >
                              <div>
                                <div className="navNotifMsg">{n.message}</div>
                                <div className="navNotifMeta">{n.createdAt}</div>
                              </div>
                              {!n.readFlag && (
                                <button type="button" className="btnGhost" onClick={() => markRead(n.id)}>
                                  Mark read
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <button type="button" className="btnGhost" onClick={logout}>Logout</button>
        </div>
      </div>
    </div>
  );
};

export default TopNav;
