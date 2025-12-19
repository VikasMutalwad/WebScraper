import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient"; 
import html2pdf from 'html2pdf.js';
import "./App.css";

// ---------------------------------------------------------
// 1. REGISTER FORM COMPONENT
// ---------------------------------------------------------
function RegisterForm({ onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState({ msg: "", type: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setStatus({ msg: error.message, type: "error" });
    else {
      setStatus({ msg: "Registration successful! Redirecting...", type: "success" });
      setTimeout(onRegister, 2000);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Register</h2>
        {status.msg && <p className={`${status.type}-msg`} style={{display: 'block'}}>{status.msg}</p>}
        <label>Email: <input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
        <label>Password: <input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
        <button type="submit">Register</button>
        <p className="link-text" onClick={onRegister} style={{cursor:'pointer', marginTop:'15px'}}>Already have an account? Login</p>
      </form>
    </div>
  );
}

// ---------------------------------------------------------
// 2. MAIN APPLICATION UI
// ---------------------------------------------------------
function MainAppUI({ user, guest, onLogout, history, fetchHistory }) {
  const [activeTab, setActiveTab] = useState("title");
  const [toast, setToast] = useState({ message: "", type: "" });
  const [data, setData] = useState({ url: "" });
  const [loading, setLoading] = useState(false);
  const [headingsFilter, setHeadingsFilter] = useState(""); // Filter Feature
  const [linksFilter, setLinksFilter] = useState(""); // Filter Feature
  const pdfRef = useRef(null);

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

 const handleScrape = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!data.url) return showToast("Please enter a URL", "error");
    
    setLoading(true);

    try {
      // --- NEW FEATURE: Invoke your Supabase Edge Function ---
      // This replaces the Microlink fetch and runs on your own backend
      const { data: responseData, error: funcError } = await supabase.functions.invoke('scraper', {
        body: { url: data.url }
      });

      if (funcError) throw funcError;

      // --- MAPPING: Ensure the cloud response matches your UI structure ---
      const result = {
        url: data.url,
        title: responseData.title || "No Title",
        headings: responseData.headings || (responseData.description ? [responseData.description] : ["No headings found"]),
        links: responseData.links || [data.url],
        images: responseData.images || [],
        meta: responseData.meta || { 
          description: responseData.description || "N/A", 
          author: responseData.author || "N/A",
          publisher: responseData.publisher || "N/A"
        }
      };

      // Update the UI state
      setData(result);
      showToast("Cloud extraction successful!", "success");

      // --- EXISTING FEATURE: Save to History ---
      if (!guest) {
        // We use the 'user' variable which should be available in your App component scope
        const { error: dbError } = await supabase
          .from('scrapes')
          .insert([{ 
            user_id: user.id, 
            url: data.url, 
            title: result.title, 
            data: result 
          }]);
          
        if (dbError) console.error("History Save Error:", dbError.message);
        
        // Refresh history list
        fetchHistory(user.id);
      }

    } catch (err) {
      console.error("Scraping error:", err);
      showToast("Scrape failed: " + (err.message || "Unknown error"), "error");
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    const options = {
      margin: 10,
      filename: `Extractify_${Date.now()}.pdf`,
      html2canvas: { scale: 2, backgroundColor: '#1a1a2e' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(options).from(pdfRef.current).save();
  };

  // Filter Logic
  const filteredHeadings = data.headings?.filter(h => h.toLowerCase().includes(headingsFilter.toLowerCase())) || [];

  return (
    <div className="container-main active">
      {toast.message && <div className={`toast ${toast.type}`}>{toast.message}</div>}

      <header className="branding">
        <div className="logo-circle">E</div>
        <h1 className="brand-name">Extractify</h1>
        <p className="desc">Welcome, {guest ? "Guest" : user?.email}!</p>
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </header>

      <form className="input-row" style={{display:'flex', gap:'10px'}} onSubmit={handleScrape}>
        <input 
          className="url-input" 
          placeholder="Paste URL..." 
          value={data.url || ""} 
          onChange={e => setData({...data, url: e.target.value})} 
        />
        <button className="scrape-btn" type="submit" disabled={loading}>
          {loading ? "..." : "Extract"}
        </button>
      </form>

      {Object.keys(data).length > 1 && !loading && (
        <div ref={pdfRef}>
          <div className="tabbar">
            {["title", "headings", "images", "links", "metadata"].map(tab => (
              <button key={tab} className={`tab ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="tab-content active">
            {activeTab === "title" && (
              <div className="card">
                <h2>Page Title</h2>
                <span className="card-highlight">{data.title}</span>
              </div>
            )}

            {activeTab === "headings" && (
              <div className="card">
                <h2>Headings</h2>
                <input className="url-input" placeholder="Filter headings..." onChange={e => setHeadingsFilter(e.target.value)} style={{marginBottom:'10px'}}/>
                {filteredHeadings.map((h, i) => <p key={i} className="card-listitem">{h}</p>)}
              </div>
            )}

            {activeTab === "images" && (
              <div className="image-gallery">
                {data.images.map((img, i) => <img key={i} src={img} className="gallery-img" alt="scraped" />)}
              </div>
            )}

            {activeTab === "links" && (
              <div className="card">
                <h2>Links</h2>
                {data.links.map((l, i) => <p key={i} style={{color:'#ffcc00', cursor:'pointer'}} onClick={() => window.open(l, '_blank')}>{l}</p>)}
              </div>
            )}

            {activeTab === "metadata" && (
              <div className="card">
                <h2>Metadata</h2>
                <p><strong>Description:</strong> {data.meta.description}</p>
                <p><strong>Author:</strong> {data.meta.author}</p>
                <p><strong>Publisher:</strong> {data.meta.publisher}</p>
              </div>
            )}
          </div>

          <div className="export-wrapper">
            <button className="export-btn" onClick={() => {
               const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
               const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'data.json'; a.click();
            }}>📁 JSON</button>
            <button className="export-btn" style={{background:'#ff5555', color:'white'}} onClick={exportPDF}>📄 PDF</button>
          </div>
        </div>
      )}

      {/* History Section */}
      {!guest && history.length > 0 && (
        <div className="history-section" style={{marginTop:'40px'}}>
          <h3 style={{color:'#ffcc00'}}>Cloud History</h3>
          {history.map(item => (
            <div key={item.id} className="history-card" onClick={() => setData(item.data)}>
              <strong>{item.title}</strong><br/><small>{item.url}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------
// 3. MAIN ENTRY POINT (APP)
// ---------------------------------------------------------
export default function App() {
  const [user, setUser] = useState(null);
  const [guest, setGuest] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [history, setHistory] = useState([]);

  const fetchHistory = async (uid) => {
    const { data } = await supabase.from('scrapes').select('*').eq('user_id', uid).order('created_at', { ascending: false });
    if (data) setHistory(data);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        fetchHistory(session.user.id);
      }
    });
  }, []);

  if (!user && !guest) {
    if (showRegister) return <RegisterForm onRegister={() => setShowRegister(false)} />;
    return (
      <LoginPage 
        onLogin={async (email, password) => {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) alert(error.message);
          else { setUser(data.user); fetchHistory(data.user.id); }
        }} 
        onGuest={() => setGuest(true)} 
        onShowRegister={() => setShowRegister(true)} 
      />
    );
  }

  return (
    <MainAppUI 
      user={user} 
      guest={guest} 
      history={history}
      fetchHistory={fetchHistory}
      onLogout={() => { supabase.auth.signOut(); setUser(null); setGuest(false); }} 
    />
  );
}

// Simple internal Login Component for App.js
function LoginPage({ onLogin, onGuest, onShowRegister }) {
  const [e, setE] = useState("");
  const [p, setP] = useState("");
  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Login</h2>
        <input type="email" placeholder="Email" onChange={x => setE(x.target.value)} />
        <input type="password" placeholder="Password" onChange={x => setP(x.target.value)} />
        <button onClick={() => onLogin(e, p)}>Login</button>
        <button onClick={onGuest} style={{marginTop:'10px', background:'#444'}}>Guest Mode</button>
        <p onClick={onShowRegister} style={{cursor:'pointer', marginTop:'15px', color:'#ffcc00'}}>Register New Account</p>
      </div>
    </div>
  );
}