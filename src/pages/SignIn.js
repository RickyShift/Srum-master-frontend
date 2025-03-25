import React, { useState } from "react";
import "../styles/SignIn.css";
import { FiArrowLeft } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";

const SignIn = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userName: username, password }),
      });

      if (!response.ok) {
        throw new Error("Invalid credentials!");
      }

      const data = await response.json();
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("username", username);
      localStorage.setItem("userId", data.id);

      navigate("/dashboard");
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="signin-container">
      <form className="signin-form" onSubmit={handleSubmit}>
        <Link to="/">
          <FiArrowLeft className="back-icon" />
        </Link>
        <h2>Sign in</h2>
        <label>Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="error-message">{error}</p>}
        <button className="signin-submit-btn" type="submit">
          Sign in
        </button>
        <div className="signin-footer">
          Don't have an account? <Link to="/signUp">Sign Up</Link>
        </div>
      </form>
    </div>
  );
};

export default SignIn;
