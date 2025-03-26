import React, { useState } from "react";
import "../styles/SignUp.css";
import { FiArrowLeft } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";

const SignUp = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Passwords do not match!");
      return;
    }

    const formattedUsername = username.toLowerCase();

    try {
      const response = await fetch(`https://scrum-master-backend.onrender.com/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userName: formattedUsername,
          password,
        }),
      });

      let data = null;
      if (response.headers.get("content-type")?.includes("application/json")) {
        data = await response.json();
      }
      if (!response.ok) {
        throw new Error("Registration failed. Username may be taken!");
      }

      localStorage.setItem("authToken", data.token); // Store token for persistence

      navigate("/dashboard");
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="signup-container">
      <form className="signup-form" onSubmit={handleSubmit}>
        <Link to="/">
          <FiArrowLeft className="back-icon" />
        </Link>
        <div className="signup-title">Sign Up</div>
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
        <label>Re-Type Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        {message && <p className="message">{message}</p>}
        <button className="submit-btn" type="submit">
          Sign Up
        </button>
        <div className="signup-footer">
          Already have an account? <Link to="/signIn">Sign In</Link>
        </div>
      </form>
    </div>
  );
};

export default SignUp;
