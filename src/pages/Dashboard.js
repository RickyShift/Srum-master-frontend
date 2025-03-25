import React from "react";
import BurndownChart from "../components/BurndownChart";
import Header from "../components/Header";
import { Link } from "react-router-dom";
import circle from "../Captura de ecrã 2025-03-04 212900.png";
import "../styles/Dashboard.css";

const Dashboard = () => {
  return (
    <div className="app">
      <Header />
      <div className="dashboard">
        <div className="dashboard-first-line">
          <p className="dashboard-title">ScrumStream Dashboard</p>

          <Link
            to="/projects"
            style={{ color: "inherit", textDecoration: "inherit" }}
          >
            <button className="dashboard-create-project">
              + Create New Project
            </button>
          </Link>
        </div>
        <div className="progress-section">
          <h2>Overall Progress</h2>
          <BurndownChart />
        </div>

        <section className="history-section">
          <div className="status-overview">
            <h3>Status Overview</h3>
            <img className="img1" src={circle} alt=""></img>
          </div>
          <div className="activity-feed">
            <h3>Recent Activity</h3>
            <div className="no-activity">
              <p>No activity yet</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
