import React from "react";
import Dashboard from "./Dashboard";

const Home = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("username");
  localStorage.removeItem("userId");
  return (
    <main>
      <Dashboard />
    </main>
  );
};

export default Home;
