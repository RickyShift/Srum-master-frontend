import React from "react";
import burndown from "../SampleBurndownChart.svg.png";
import "../styles/BurndownChart.css";

const BurndownChart = () => {
  return (
    <div className="burndown-chart">
      <img className="img2" src={burndown} alt=""></img>
    </div>
  );
};

export default BurndownChart;
