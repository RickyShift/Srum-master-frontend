import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Sprints from "./pages/Sprints";
import UserStories from "./pages/UserStories";
import Backlog from "./pages/Backlog";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import "./reset.css"; // Import your CSS reset

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/sprints" element={<Sprints />} />
        <Route path="/userStories" element={<UserStories />} />
        <Route path="/backlog" element={<Backlog />} />
        <Route path="/signUp" element={<SignUp />} />
        <Route path="/signIn" element={<SignIn />} />
      </Routes>
    </Router>
  );
}

export default App;
