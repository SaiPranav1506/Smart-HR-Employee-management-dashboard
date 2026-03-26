import React, { useState, useEffect, useRef } from "react";
import { apiClient, getApiErrorMessage } from "../../api/client";
import { authStorage } from "../../auth/storage";

const FILE_ICONS = {
  "application/pdf": "📄",
  "application/msword": "📝",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "📝",
  "application/vnd.ms-excel": "📊",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "📊",
  "application/vnd.ms-powerpoint": "📽️",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "📽️",
  "text/plain": "📃",
  "text/csv": "📊",
  "image/png": "🖼️",
  "image/jpeg": "🖼️",
  "image/gif": "🖼️",
  "image/webp": "🖼️",
  "application/zip": "📦",
  "application/json": "🔧",
};

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function FileUploadSection() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const token = authStorage.getToken();
      const res = await apiClient.get("/api/files/my-files", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFiles(res.data);
    } catch (err) {
      console.error("Failed to load files", err);
    }
  };

  const handleUpload = async (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    setError(null);
    setUploading(true);

    const token = authStorage.getToken();

    for (const file of selectedFiles) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        await apiClient.post("/api/files/upload", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      } catch (err) {
        setError(getApiErrorMessage(err, `Failed to upload ${file.name}`));
      }
    }

    setUploading(false);
    fetchFiles();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      const token = authStorage.getToken();
      const res = await apiClient.get(`/api/files/download/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to download file"));
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm("Delete this file?")) return;
    try {
      const token = authStorage.getToken();
      await apiClient.delete(`/api/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchFiles();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to delete file"));
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <div className="cardInner">
        <h3 style={{ marginTop: 0, color: "var(--gold)", fontWeight: 900 }}>
          My Files 📁
        </h3>

        {error && (
          <div
            style={{
              padding: "8px 12px",
              marginBottom: 12,
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: 6,
              color: "var(--error, #ef4444)",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? "var(--gold)" : "var(--border)"}`,
            borderRadius: 10,
            padding: "28px 20px",
            textAlign: "center",
            cursor: "pointer",
            backgroundColor: dragOver ? "rgba(59, 130, 246, 0.08)" : "transparent",
            transition: "all 0.2s ease",
            marginBottom: 16,
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: "none" }}
            onChange={(e) => handleUpload(e.target.files)}
          />
          <p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>
            {uploading ? "Uploading..." : "Click or drag & drop files here"}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--muted)", opacity: 0.7 }}>
            PDF, Word, Excel, PowerPoint, Images, CSV, ZIP — up to 10 MB each
          </p>
        </div>

        {/* File list */}
        {files.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 13 }}>No files uploaded yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {files.map((f) => (
              <div
                key={f.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  backgroundColor: "rgba(0, 0, 0, 0.15)",
                  border: "1px solid var(--border-2)",
                  borderRadius: 6,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 20 }}>{FILE_ICONS[f.fileType] || "📎"}</span>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {f.fileName}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>
                      {formatFileSize(f.fileSize)} • {new Date(f.uploadedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => handleDownload(f.id, f.fileName)}
                    title="Download"
                    style={{
                      background: "none",
                      border: "1px solid var(--border)",
                      borderRadius: 4,
                      padding: "4px 8px",
                      cursor: "pointer",
                      fontSize: 13,
                      color: "var(--gold)",
                    }}
                  >
                    ⬇️
                  </button>
                  <button
                    onClick={() => handleDelete(f.id)}
                    title="Delete"
                    style={{
                      background: "none",
                      border: "1px solid var(--border)",
                      borderRadius: 4,
                      padding: "4px 8px",
                      cursor: "pointer",
                      fontSize: 13,
                      color: "var(--error, #ef4444)",
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
