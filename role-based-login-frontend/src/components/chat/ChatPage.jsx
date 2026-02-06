import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import TopNav from "../common/TopNav";
import { authStorage } from "../../auth/storage";

const API = "http://localhost:8080";

const normalizeRole = (r) => String(r || "").toLowerCase();

const ChatPage = () => {
  const token = authStorage.getToken();
  const myEmail = authStorage.getEmail();
  const myRole = normalizeRole(authStorage.getRole());

  const [targetRole, setTargetRole] = useState("hr");
  const [contactsByRole, setContactsByRole] = useState({});
  const [receiverEmail, setReceiverEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  const [inbox, setInbox] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const allowedTargets = useMemo(() => {
    // keep simple + aligned to your use case
    if (myRole === "employee") return ["hr", "driver"];
    if (myRole === "driver") return ["employee", "hr"];
    if (myRole === "hr") return ["employee", "driver"];
    if (myRole === "admin") return ["hr", "employee", "driver"];
    return ["hr", "employee", "driver"];
  }, [myRole]);

  useEffect(() => {
    if (!allowedTargets.includes(targetRole)) {
      setTargetRole(allowedTargets[0] || "hr");
    }
  }, [allowedTargets, targetRole]);

  const loadContacts = async (role) => {
    try {
      const res = await axios.get(`${API}/api/chat/contacts?role=${encodeURIComponent(role)}`);
      return Array.isArray(res.data) ? res.data : [];
    } catch (e) {
      console.error("Failed to load contacts", e);
      return [];
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

  useEffect(() => {
    // initial load
    (async () => {
      const next = {};
      for (const r of allowedTargets) {
        next[r] = await loadContacts(r);
      }
      setContactsByRole(next);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedTargets.join(",")]);

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
    if (myRole === "employee" && targetRole === "driver") return "DRIVER_DIRECTION";
    return "GENERAL";
  }, [myRole, targetRole]);

  const send = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSending(true);
    try {
      await axios.post(
        `${API}/api/chat/messages`,
        {
          senderEmail: myEmail,
          senderRole: myRole,
          receiverEmail: receiverEmail || null,
          receiverRole: receiverEmail ? null : targetRole,
          subject: subject || null,
          content,
          messageType: inferredMessageType,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setContent("");
      setSubject("");
      await refreshInbox();
      alert("Message sent");
    } catch (err) {
      console.error("Send failed", err);
      alert(err.response?.data || "Failed to send message");
    } finally {
      setSending(false);
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
            Employees can send queries to HR and directions to drivers.
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
                      : inferredMessageType === "DRIVER_DIRECTION"
                        ? "Type directions for the driver..."
                        : "Type your message..."
                  }
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />

                <div style={{ height: 12 }} />

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <button type="submit" className="btnPrimary" disabled={sending || !content.trim() || currentContacts.length === 0}>
                    {sending ? "Sending..." : "Send"}
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
                <h3 style={{ marginTop: 0, color: "var(--gold)", fontWeight: 900 }}>Inbox</h3>
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
                      <th>From</th>
                      <th>To</th>
                      <th>Type</th>
                      <th>Subject</th>
                      <th>Message</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {inbox.slice(0, 25).map((m) => (
                      <tr key={m.id}>
                        <td>{m.senderEmail}</td>
                        <td>{m.receiverEmail || m.receiverRole}</td>
                        <td>{m.messageType || "—"}</td>
                        <td>{m.subject || "—"}</td>
                        <td style={{ maxWidth: 320, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {m.content}
                        </td>
                        <td>{m.createdAt}</td>
                        <td>{m.readFlag ? "Read" : "Unread"}</td>
                        <td>
                          {!m.readFlag && (
                            <button type="button" className="btnGhost" onClick={() => markRead(m.id)}>
                              Mark read
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
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
