import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import TopNav from "../common/TopNav";
import { authStorage } from "../../auth/storage";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

import { API_BASE_URL } from "../../api/client";

const API = API_BASE_URL;

const normalizeRole = (r) => String(r || "").toLowerCase();

const formatFileSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const ChatPage = () => {
  const token = authStorage.getToken();
  const myEmail = authStorage.getEmail();
  const myRole = normalizeRole(authStorage.getRole());

  const [allowedTargets, setAllowedTargets] = useState([]);
  const [targetRole, setTargetRole] = useState("hr");
  const [contactsByRole, setContactsByRole] = useState({});
  const [receiverEmail, setReceiverEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  const fileInputRef = useRef(null);

  const [inbox, setInbox] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const loadContactsForMe = async () => {
    try {
      const res = await axios.get(`${API}/api/chat/contacts-for-me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data || {};
      const nextAllowed = Array.isArray(data.allowedTargets) ? data.allowedTargets : [];
      const nextByRole = data.contactsByRole && typeof data.contactsByRole === "object" ? data.contactsByRole : {};

      setAllowedTargets(nextAllowed);
      setContactsByRole(nextByRole);

      const nextTargetRole = nextAllowed.includes(targetRole) ? targetRole : (nextAllowed[0] || "hr");
      setTargetRole(nextTargetRole);

      const list = nextByRole[nextTargetRole] || [];
      const currentIsValid = list.some((c) => String(c?.email || "").toLowerCase() === String(receiverEmail || "").toLowerCase());
      if (!currentIsValid) {
        setReceiverEmail((list[0] && list[0].email) || "");
      }
    } catch (e) {
      console.error("Failed to load contacts-for-me", e);
      setAllowedTargets([]);
      setContactsByRole({});
      setReceiverEmail("");
    }
  };

  const refreshInbox = async () => {
    if (!myEmail && !myRole) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/chat/inbox?email=${encodeURIComponent(myEmail || "")}&role=${encodeURIComponent(myRole || "")}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInbox(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Failed to load inbox", e);
    } finally {
      setLoading(false);
    }
  };

  // Live updates: subscribe to inbox topics (email + role)
  useEffect(() => {
    const emailKey = String(myEmail || "").trim().toLowerCase();
    const roleKey = String(myRole || "").trim().toLowerCase();
    if (!emailKey && !roleKey) return;

    const wsUrl = `${API_BASE_URL}/ws`;

    const client = new Client({
      // Use SockJS for broader compatibility
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 2500,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {},
    });

    client.onConnect = () => {
      if (emailKey) {
        client.subscribe(`/topic/inbox.${emailKey}`, () => {
          refreshInbox();
        });
      }

      if (roleKey) {
        client.subscribe(`/topic/inbox.role.${roleKey}`, () => {
          refreshInbox();
        });
      }
    };

    client.onStompError = (frame) => {
      console.error("Live chat STOMP error", frame?.headers?.message, frame?.body);
    };

    client.onWebSocketError = (e) => {
      console.error("Live chat websocket error", e);
    };

    client.activate();
    return () => {
      try {
        client.deactivate();
      } catch {
        // ignore
      }
    };
    // Intentionally avoid depending on refreshInbox reference changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myEmail, myRole]);

  useEffect(() => {
    loadContactsForMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    refreshInbox();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myEmail, myRole, token]);

  useEffect(() => {
    const list = contactsByRole[targetRole] || [];
    if (!receiverEmail && list.length > 0) {
      setReceiverEmail(list[0].email || "");
    }
  }, [contactsByRole, targetRole, receiverEmail]);

  const inferredMessageType = useMemo(() => {
    if (myRole === "employee" && targetRole === "hr") return "HR_QUERY";
    if (myRole === "employee" && targetRole === "employee") return "PEER_CHAT";
    if (myRole === "driver" && targetRole === "hr") return "DRIVER_TO_HR";
    if (myRole === "driver" && targetRole === "driver") return "DRIVER_PEER";
    if (myRole === "hr" && targetRole === "employee") return "HR_TO_EMP";
    if (myRole === "hr" && targetRole === "driver") return "HR_TO_DRIVER";
    if (myRole === "hr" && targetRole === "hr") return "HR_PEER";
    return "GENERAL";
  }, [myRole, targetRole]);

  const send = async (e) => {
    e.preventDefault();
    if (!content.trim() && !attachedFile) return;

    setSending(true);
    try {
      if (attachedFile) {
        // Send as multipart with file
        const formData = new FormData();
        formData.append("file", attachedFile);
        formData.append("receiverEmail", receiverEmail || "");
        if (subject) formData.append("subject", subject);
        if (content.trim()) formData.append("content", content);
        formData.append("messageType", inferredMessageType);

        await axios.post(`${API}/api/chat/messages/with-file`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        await axios.post(
          `${API}/api/chat/messages`,
          {
            senderEmail: myEmail,
            senderRole: myRole,
            receiverEmail: receiverEmail || null,
            receiverRole: null,
            subject: subject || null,
            content,
            messageType: inferredMessageType,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setContent("");
      setSubject("");
      setAttachedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await refreshInbox();
      alert("Message sent");
    } catch (err) {
      console.error("Send failed", err);
      alert(err.response?.data || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const downloadChatFile = async (msgId, fileName) => {
    try {
      const res = await axios.get(`${API}/api/chat/messages/${msgId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "file";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed", err);
      alert("Failed to download file");
    }
  };

  const markRead = async (id) => {
    try {
      await axios.put(`${API}/api/chat/messages/${id}/read?email=${encodeURIComponent(myEmail || "")}`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await refreshInbox();
    } catch (e) {
      console.error("Failed to mark read", e);
    }
  };

  const currentContacts = contactsByRole[targetRole] || [];

  return (
    <>
      <TopNav title="Chat" />
      <div className="page">
        <div className="container" style={{ maxWidth: 1100 }}>
          <h2 className="hTitle">Chat</h2>
          <div className="subtle" style={{ marginTop: 6 }}>
            HR ↔ Employees under them, Drivers, and HR peers. Employees ↔ their HR and employees under the same HR. Drivers ↔ all HRs and fellow drivers.
          </div>

          <div style={{ height: 14 }} />

          <div className="card">
            <div className="cardInner">
              <h3 style={{ marginTop: 0, color: "var(--gold)", fontWeight: 900 }}>Send a message</h3>

              <form onSubmit={send}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className="subtle">Send to role</label>
                    <select
                      className="select"
                      value={targetRole}
                      onChange={(e) => {
                        setTargetRole(e.target.value);
                        setReceiverEmail("");
                      }}
                    >
                      {allowedTargets.map((r) => (
                        <option key={r} value={r}>
                          {r.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="subtle">Receiver</label>
                    <select
                      className="select"
                      value={receiverEmail}
                      onChange={(e) => setReceiverEmail(e.target.value)}
                      disabled={currentContacts.length === 0}
                    >
                      {currentContacts.length === 0 ? (
                        <option value="">No users found</option>
                      ) : (
                        currentContacts.map((u) => (
                          <option key={u.email} value={u.email}>
                            {u.username ? `${u.username} (${u.email})` : u.email}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                <div style={{ height: 12 }} />

                <input
                  className="input"
                  placeholder="Subject (optional)"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />

                <div style={{ height: 12 }} />

                <textarea
                  className="textarea"
                  rows={4}
                  placeholder={
                    inferredMessageType === "HR_QUERY"
                      ? "Type your HR query..."
                      : "Type your message..."
                  }
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />

                <div style={{ height: 12 }} />

                {/* File attachment */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <label
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "6px 14px", borderRadius: 8,
                      border: "1px solid var(--gold, #c9a227)",
                      color: "var(--gold, #c9a227)", cursor: "pointer",
                      fontSize: 14, fontWeight: 600,
                      background: "transparent", transition: "background 0.2s",
                    }}
                    onMouseEnter={(ev) => ev.currentTarget.style.background = "rgba(201,162,39,0.1)"}
                    onMouseLeave={(ev) => ev.currentTarget.style.background = "transparent"}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M16.5 6v11.5a4 4 0 0 1-8 0V5a2.5 2.5 0 0 1 5 0v10.5a1 1 0 0 1-2 0V6h-1.5v9.5a2.5 2.5 0 0 0 5 0V5a4 4 0 0 0-8 0v12.5a5.5 5.5 0 0 0 11 0V6H16.5z"
                        fill="currentColor" />
                    </svg>
                    Attach File
                    <input
                      ref={fileInputRef}
                      type="file"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const f = e.target.files[0];
                        if (f && f.size > 10 * 1024 * 1024) {
                          alert("File too large. Maximum 10 MB");
                          e.target.value = "";
                          return;
                        }
                        setAttachedFile(f || null);
                      }}
                    />
                  </label>

                  {attachedFile && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-secondary, #aaa)" }}>
                      <span style={{ fontWeight: 600, color: "var(--text-primary, #fff)" }}>{attachedFile.name}</span>
                      <span>({formatFileSize(attachedFile.size)})</span>
                      <button
                        type="button"
                        onClick={() => { setAttachedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                        style={{ background: "none", border: "none", color: "#e74c3c", cursor: "pointer", fontSize: 16, fontWeight: 700, padding: "0 4px" }}
                        title="Remove file"
                      >×</button>
                    </span>
                  )}
                </div>

                <div style={{ height: 12 }} />

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <button type="submit" className="btnPrimary" disabled={sending || (!content.trim() && !attachedFile) || currentContacts.length === 0}>
                    {sending ? "Sending..." : attachedFile ? "Send with File" : "Send"}
                  </button>
                  <span className="subtle">Type: {inferredMessageType}</span>
                </div>
              </form>
            </div>
          </div>

          <div style={{ height: 18 }} />

          <div className="card">
            <div className="cardInner">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <h3 style={{ marginTop: 0, color: "var(--gold)", fontWeight: 900 }}>Messages</h3>
                <button type="button" className="btnGhost" onClick={refreshInbox} disabled={loading}>
                  {loading ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              {inbox.length === 0 ? (
                <div className="subtle">No messages yet.</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>From</th>
                      <th>To</th>
                      <th>Type</th>
                      <th>Subject</th>
                      <th>Message</th>
                      <th>File</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {inbox.slice(0, 25).map((m) => {
                      const isSent = (m.senderEmail || "").toLowerCase() === (myEmail || "").toLowerCase();
                      return (
                      <tr key={m.id} style={{ opacity: isSent ? 0.85 : 1 }}>
                        <td>
                          <span style={{
                            display: "inline-block", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                            background: isSent ? "rgba(201,162,39,0.15)" : "rgba(46,204,113,0.15)",
                            color: isSent ? "var(--gold, #c9a227)" : "#2ecc71",
                          }}>
                            {isSent ? "Sent" : "Received"}
                          </span>
                        </td>
                        <td>{isSent ? "You" : m.senderEmail}</td>
                        <td>{isSent ? (m.receiverEmail || m.receiverRole) : "You"}</td>
                        <td>{m.messageType || "—"}</td>
                        <td>{m.subject || "—"}</td>
                        <td style={{ maxWidth: 320, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {m.content}
                        </td>
                        <td>
                          {m.fileName ? (
                            <button
                              type="button"
                              className="btnGhost"
                              style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, padding: "2px 8px" }}
                              onClick={() => downloadChatFile(m.id, m.fileName)}
                              title={`${m.fileName} (${formatFileSize(m.fileSize)})`}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M12 16l-5-5h3V4h4v7h3l-5 5zm-7 2h14v2H5v-2z" fill="currentColor"/>
                              </svg>
                              {m.fileName.length > 18 ? m.fileName.slice(0, 15) + "..." : m.fileName}
                            </button>
                          ) : (
                            <span style={{ color: "var(--text-disabled, #555)" }}>—</span>
                          )}
                        </td>
                        <td>{m.createdAt}</td>
                        <td>{m.readFlag ? "Read" : "Unread"}</td>
                        <td>
                          {!isSent && !m.readFlag && (
                            <button type="button" className="btnGhost" onClick={() => markRead(m.id)}>
                              Mark read
                            </button>
                          )}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatPage;
