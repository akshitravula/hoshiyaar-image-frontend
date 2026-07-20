import React, { useCallback, useState } from "react";
import axios from "axios";

const MAX_FILES = 200;
const MAX_FILE_SIZE_MB = 50;
const rawApiBase = import.meta.env.VITE_API_BASE || "";
const API_BASE = (() => {
  if (!rawApiBase) return "";
  // if already absolute (starts with http:// or https://) or protocol-relative (//), use as-is
  if (/^(https?:)?\/\//i.test(rawApiBase)) return rawApiBase;
  // otherwise, assume https and prepend
  return `https://${rawApiBase}`;
})();

function App() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [server, setServer] = useState("1");

  const handleFiles = useCallback((fileList) => {
    const arr = Array.from(fileList);
    if (arr.length > MAX_FILES) {
      setError(`You can upload up to ${MAX_FILES} images at once.`);
      return;
    }

    const tooBig = arr.find((f) => f.size > MAX_FILE_SIZE_MB * 1024 * 1024);
    if (tooBig) {
      setError(
        `File "${tooBig.name}" is larger than ${MAX_FILE_SIZE_MB}MB. Please remove or compress it.`
      );
      return;
    }

    setError("");
    setFiles(arr);
  }, []);

  const onInputChange = (e) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const upload = async () => {
    if (!files.length) return;
    setUploading(true);
    setError("");
    setResults([]);

    try {
      const formData = new FormData();
      formData.append("server", server);
      files.forEach((file) => formData.append("images", file));

      const res = await axios.post(`${API_BASE}/api/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setResults(res.data.images || []);
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.error || err.message || "Upload failed. Try again.";
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const copyAll = async () => {
    const text = results.map((r, idx) => `${idx + 1}. ${r.url}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  };

  const copyOne = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // ignore
    }
  };

  return (
    <div className="page">
      <div className="card">
        <h1>Images Upload</h1>
        <p className="subtitle">
          Drop images here or browse. Up to {MAX_FILES} images,{" "}
          {MAX_FILE_SIZE_MB}MB each.
        </p>

        <div className="server-select" style={{ marginBottom: "1rem", display: "flex", gap: "1rem", justifyContent: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.25rem", cursor: "pointer" }}>
            <input
              type="radio"
              value="1"
              checked={server === "1"}
              onChange={(e) => setServer(e.target.value)}
            />
            Image Server 1
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "0.25rem", cursor: "pointer" }}>
            <input
              type="radio"
              value="2"
              checked={server === "2"}
              onChange={(e) => setServer(e.target.value)}
            />
            Image Server 2
          </label>
        </div>

        <div
          className="dropzone"
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <p>Click to choose or drag &amp; drop</p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onInputChange}
          />
        </div>

        <div className="files-info">
          <span>{files.length} files selected</span>
          {files.length > 0 && (
            <button
              className="link"
              type="button"
              onClick={() => setFiles([])}
            >
              Remove
            </button>
          )}
        </div>

        <button
          className="primary-btn"
          type="button"
          disabled={!files.length || uploading}
          onClick={upload}
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>

        {error && <div className="error">{error}</div>}

        {results.length > 0 && (
          <div className="results">
            <div className="results-header">
              <span>{results.length} images ready</span>
              <button
                type="button"
                className="secondary-btn"
                onClick={copyAll}
              >
                Copy all
              </button>
            </div>
            <div className="results-list">
              {results.map((img, index) => (
                <div key={img.publicId || img.url} className="result-row">
                  <span className="index">#{index + 1}</span>
                  <div className="result-main">
                    <div className="result-name" title={img.originalName}>
                      {img.originalName || "Unnamed image"}
                    </div>
                    <input
                      type="text"
                      readOnly
                      value={img.url}
                      onFocus={(e) => e.target.select()}
                    />
                  </div>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => copyOne(img.url)}
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

