import { Link, useNavigate } from "react-router-dom";
import "../styles/Header.css";
import React, { useEffect, useState } from "react";
import { FiLogOut } from "react-icons/fi";

const Header = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const storedUsername = localStorage.getItem("username");
    if (token && storedUsername) {
      setUser(storedUsername); // Set username if token exists
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    setUser(null);
    navigate("/");
  };

  return (
    <header className="header">
      <div className="header-logo">
        ScrumStream
        <div className="header-auth-buttons">
          {user && (
            <div className="header-user">
              <span className="welcome-text">Hi, {user} !</span>
              <button className="logout-button" onClick={handleLogout}>
                <FiLogOut className="logout-icon" />
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="header-buttons">
        <div className="header-nav">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/projects">Projects</Link>
          <Link to="/backlog">Backlog</Link>
          <Link to="/sprints">Sprints</Link>
          <Link to="/userStories">Board</Link>
        </div>
        <div className="header-auth-buttons">
          <Link
            to="/signIn"
            style={{ color: "inherit", textDecoration: "inherit" }}
          >
            <button className="header-login">Sign In</button>
          </Link>

          <Link
            to="/signUp"
            style={{ color: "inherit", textDecoration: "inherit" }}
          >
            <button className="header-signup">Sign Up</button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
