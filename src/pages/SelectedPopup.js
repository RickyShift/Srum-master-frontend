import React from "react";
import "../styles/SelectedPopup.css";

function SelectedPopup({ trigger, setTrigger, children }) {
  return trigger ? (
    <div className="popup">
      <div className="popup-inner">
        <div className="popup-btn">
          <button className="close-btn" onClick={() => setTrigger(false)}>
            ✖
          </button>
        </div>
        <div className="popup-content">{children}</div>
      </div>
    </div>
  ) : null;
}

export default SelectedPopup;
