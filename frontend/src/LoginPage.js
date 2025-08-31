// src/LoginPage.js
import React, { useState } from "react";

// Simulated backend API for login demo
const fakeApi = {
  login: async ({ username, password }) => {
    if (username === "user" && password === "pass") {
      return { username };
    }
    throw new Error("Invalid credentials");
  },
};

export default function LoginPage({ onLogin, onGuest, onShowRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await fakeApi.login({ username, password });
      onLogin(user);
    } catch (err) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <label>
        Username: <input value={username} onChange={(e) => setUsername(e.target.value)} required />
      </label>
      <br />
      <label>
        Password: <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      <br />
      <button type="submit">Login</button>
      <button type="button" onClick={onGuest} style={{ marginLeft: "10px" }}>
        Continue as Guest
      </button>
      <p>
        Don't have an account?{" "}
        <button
          type="button"
          onClick={onShowRegister}
          style={{ textDecoration: "underline", background: "none", border: "none", color: "blue", cursor: "pointer" }}
        >
          Register
        </button>
      </p>
    </form>
  );
}
