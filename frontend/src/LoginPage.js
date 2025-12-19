import React, { useState } from "react";

export default function LoginPage({ onLogin, onGuest, onShowRegister }) {
  const [username, setUsername] = useState(""); // This will be used as the Email
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // We pass the email (username) and password to the onLogin function 
      // which now contains the real Supabase logic in App.js
      await onLogin(username, password);
    } catch (err) {
      setError("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Login</h2>
      {error && <p className="error-msg" style={{ color: "red", display: "block" }}>{error}</p>}
      
      <label>
        Username (Email): 
        <input 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          placeholder="email@example.com"
          required 
        />
      </label>
      <br />
      <label>
        Password: 
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
      </label>
      <br />
      
      <button type="submit" disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>

      <button type="button" onClick={onGuest} style={{ marginLeft: "10px" }} className="guest-btn">
        Continue as Guest
      </button>

      <p className="link-text">
        Don't have an account?{" "}
        <button
          type="button"
          onClick={onShowRegister}
          style={{ 
            textDecoration: "underline", 
            background: "none", 
            border: "none", 
            color: "#ffcc00", 
            cursor: "pointer",
            fontWeight: "bold" 
          }}
        >
          Register
        </button>
      </p>
    </form>
  );
}