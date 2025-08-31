import React, { useState, useEffect, useRef } from "react";
import LoginPage from "./LoginPage"; // Make sure LoginPage.js is in src folder
import "./App.css";

function RegisterForm({ onRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Dummy register simulation
  const fakeRegisterAPI = async ({ username, password }) => {
    return new Promise((resolve) => setTimeout(() => resolve({ username }), 1000));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await fakeRegisterAPI({ username, password });
      setSuccess("Registration successful! Please login.");
      setError("");
      onRegister();
    } catch (err) {
      setError(err.message || "Registration failed");
      setSuccess("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Register</h2>
      {error && <p className="error-msg">{error}</p>}
      {success && <p className="success-msg">{success}</p>}
      <label>Username:
        <input value={username} onChange={e => setUsername(e.target.value)} required />
      </label>
      <label>Password:
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
      </label>
      <button type="submit">Register</button>
      <p className="link-text" onClick={onRegister} tabIndex={0} role="button" aria-label="Go to Login page">
        Already have an account? Login
      </p>
    </form>
  );
}

function MainAppUI({ user, guest, onLogout }) {
  const [activeTab, setActiveTab] = useState("title");
  const [toast, setToast] = useState({ message: "", type: "" });
  const [headingsFilter, setHeadingsFilter] = useState("");
  const [linksFilter, setLinksFilter] = useState("");
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pdfRef = useRef(null);

  useEffect(() => {
    // Reset states or fetch user history here if needed
  }, [user]);

  // Copy to clipboard helper
  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text)
      .then(() => setToast({ message: "Copied to clipboard!", type: "success" }))
      .catch(() => setToast({ message: "Failed to copy", type: "error" }));
  };

  // JSON export (kept simple)
  const exportData = () => {
    if (!data) return;
    const exportDataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([exportDataStr], { type: "application/json" });
    const url_ = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url_;
    a.download = "extractify_data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setToast({ message: "Exported data as JSON file", type: "success" });
  };

  // Your scraping UI & API calls go here. For demo, simple placeholder:
  const handleScrape = async () => {
    if (!data.url) {
      setToast({ message: "Please enter a URL", type: "error" });
      return;
    }
    setLoading(true);
    setError("");
    try {
      // Simulate scraping process
      const result = {
        title: "Example Page Title",
        headings: ["Heading 1", "Heading 2"],
        links: ["https://example.com", "https://openai.com"],
        images: ["https://placekitten.com/200/300"],
        meta: { description: "Example meta description", keywords: "example, scrape", author: "Admin" },
      };
      setData(result);
      setActiveTab("title");
      setToast({ message: "Data extracted successfully!", type: "success" });
    } catch (e) {
      setError("Failed to scrape. Please try again.");
    }
    setLoading(false);
  };

  const filteredHeadings = (data.headings || []).filter(h =>
    h.toLowerCase().includes(headingsFilter.toLowerCase())
  );
  const filteredLinks = (data.links || []).filter(l =>
    l.toLowerCase().includes(linksFilter.toLowerCase())
  );

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  return (
    <div className="container-main">
      {toast.message && (
        <div className={"toast " + toast.type} role="alert" aria-live="assertive">
          {toast.message}
          <button className="toast-close" aria-label="Close notification" onClick={() => setToast({ message: "", type: "" })}>&times;</button>
        </div>
      )}

      <header className="branding animated-fadein">
        <div className="logo-circle" title="Extractify Logo">E</div>
        <h1 className="brand-name">Extractify</h1>
        <p className="desc">Welcome, {guest ? "Guest" : user.username}!</p>
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </header>

      <form className="input-row animated-pop" onSubmit={e => { e.preventDefault(); handleScrape(); }} aria-label="Scrape URL form">
        <input
          type="text"
          className="url-input"
          placeholder="Paste any website URL…"
          value={data.url || ""}
          onChange={e => setData(prev => ({ ...prev, url: e.target.value }))}
          disabled={loading}
          aria-required="true"
        />
        <button className="scrape-btn" type="submit" disabled={loading}>
          {loading ? "Extracting…" : "Extract"}
        </button>
      </form>

      {error && <p className="error-msg" role="alert">{error}</p>}

      {Object.keys(data).length > 0 && !loading && (
        <>
          <div role="tablist" className="tabbar animated-fadeinup" aria-label="Data Tabs">
            {["title", "headings", "images", "links", "metadata"].map(tab => (
              <button
                key={tab}
                className={"tab" + (activeTab === tab ? " active" : "")}
                onClick={() => setActiveTab(tab)}
                role="tab"
                aria-selected={activeTab === tab}
                aria-controls={`${tab}-panel`}
                id={`${tab}-tab`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div ref={pdfRef} className="tab-content animated-appear">
            {activeTab === "title" && (
              <div id="title-panel" role="tabpanel" aria-labelledby="title-tab" className="card">
                <h2>Page Title</h2>
                <div className="card-data">
                  <span className="card-highlight">{data.title || "No title found"}</span>
                  <button className="copy-btn" onClick={() => copyToClipboard(data.title)} aria-label="Copy page title">📋 Copy</button>
                </div>
              </div>
            )}

            {activeTab === "headings" && (
              <div id="headings-panel" role="tabpanel" aria-labelledby="headings-tab" className="card">
                <h2>Headings</h2>
                <input
                  type="search"
                  className="filter-input"
                  placeholder="Filter headings..."
                  value={headingsFilter}
                  onChange={e => setHeadingsFilter(e.target.value)}
                  aria-label="Filter headings"
                />
                <div className="card-data">
                  {filteredHeadings.length > 0 ? (
                    <>
                      <button
                        className="copy-btn"
                        onClick={() => copyToClipboard(filteredHeadings.join("\n"))}
                        aria-label="Copy all headings"
                      >
                        📋 Copy All
                      </button>
                      <ul>
                        {filteredHeadings.map((h, i) => (
                          <li key={i} className="card-listitem">
                            {h}{" "}
                            <button
                              className="copy-inline"
                              onClick={() => copyToClipboard(h)}
                              aria-label={`Copy heading ${i + 1}`}
                            >
                              📋
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="muted">No headings match the filter</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "images" && (
              <div id="images-panel" role="tabpanel" aria-labelledby="images-tab" className="card">
                <h2>Images</h2>
                <div className="image-gallery">
                  {data.images && data.images.length > 0 ? (
                    data.images.map((img, i) => (
                      <img
                        key={i}
                        className="gallery-img animated-pop"
                        src={img}
                        alt={`img-${i}`}
                        loading="lazy"
                      />
                    ))
                  ) : (
                    <p className="muted">No images found</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "links" && (
              <div id="links-panel" role="tabpanel" aria-labelledby="links-tab" className="card">
                <h2>Links</h2>
                <input
                  type="search"
                  className="filter-input"
                  placeholder="Filter links..."
                  value={linksFilter}
                  onChange={e => setLinksFilter(e.target.value)}
                  aria-label="Filter links"
                />
                <div className="card-data">
                  {filteredLinks.length > 0 ? (
                    <>
                      <button
                        className="copy-btn"
                        onClick={() => copyToClipboard(filteredLinks.join("\n"))}
                        aria-label="Copy all links"
                      >
                        📋 Copy All
                      </button>
                      <ul>
                        {filteredLinks.map((l, i) => {
                          const favicon = isValidUrl(l) ? `${new URL(l).origin}/favicon.ico` : null;
                          return (
                            <li key={i} className="card-listitem">
                              {favicon && <img src={favicon} alt="favicon" className="favicon" />}
                              <a href={l} target="_blank" rel="noreferrer" className="link" tabIndex={0}>
                                {l}
                              </a>{" "}
                              <button
                                className="copy-inline"
                                onClick={() => copyToClipboard(l)}
                                aria-label={`Copy link ${i + 1}`}
                              >
                                📋
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  ) : (
                    <p className="muted">No links match the filter</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "metadata" && (
              <div id="metadata-panel" role="tabpanel" aria-labelledby="metadata-tab" className="card">
                <h2>Metadata</h2>
                <div className="card-data">
                  <p>
                    <strong>Description:</strong> {data.meta?.description || "No description found"}
                  </p>
                  <p>
                    <strong>Keywords:</strong> {data.meta?.keywords || "No keywords found"}
                  </p>
                  <p>
                    <strong>Author:</strong> {data.meta?.author || "Not specified"}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="export-wrapper">
            <button className="export-btn" onClick={exportData} aria-label="Export JSON">
              📁 Export JSON
            </button>
            {/* Add other export buttons if you want */}
          </div>
        </>
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null); // null = not logged in
  const [guest, setGuest] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  if (!user && !guest) {
    if (showRegister) {
      return <RegisterForm onRegister={() => setShowRegister(false)} />;
    }
    return (
      <LoginPage
        onLogin={(userData) => {
          setUser(userData);
          setGuest(false);
          setShowRegister(false);
        }}
        onGuest={() => {
          setGuest(true);
          setShowRegister(false);
        }}
        onShowRegister={() => setShowRegister(true)}
      />
    );
  }

  return <MainAppUI user={user} guest={guest} onLogout={() => {
    setUser(null);
    setGuest(false);
    setShowRegister(false);
  }} />;
}
