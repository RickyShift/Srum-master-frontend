import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import SelectedPopup from "./SelectedPopup";
import "../styles/Sprints.css";

export default function Sprints() {
  const [sprints, setSprints] = useState([]);
  const [newSprint, setNewSprint] = useState({
    name: "",
    description: "",
    endDate: "",
    projectId: "",
  });
  const [projects, setProjects] = useState([]);
  const [userStories, setUserStories] = useState([]);
  const [selectedSprint, setSelectedSprint] = useState("");
  const [selectedProjectFilter, setSelectedProjectFilter] = useState("");
  const [editPopup, setEditPopup] = useState(false);
  const [editedSprint, setEditedSprint] = useState({});
  const [selectedPopup, setSelectedPopup] = useState(false);
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    (async () => {
      try {
        const sprintRes = await fetch(`${API_BASE_URL}/api/sprint`);
        const sprints = await sprintRes.json();

        const sprintsWithProjects = await Promise.all(
          (sprints || []).map(async (sprint) => {
            if (sprint?.id) {
              try {
                const projectRes = await fetch(
                  `${API_BASE_URL}/api/sprint/project/${sprint.id}`
                );
                const project = await projectRes.json().catch(() => null);
                return { ...sprint, project };
              } catch (error) {
                console.error(
                  `Error fetching project for sprint ${sprint.id}:`,
                  error
                );
                return { ...sprint, project: null };
              }
            }
            return null;
          })
        );

        setSprints(sprintsWithProjects.filter(Boolean));
      } catch (error) {
        console.error("Error fetching sprints:", error);
      }

      try {
        const projectRes = await fetch(`${API_BASE_URL}/api/project`);
        const projectsData = await projectRes.json();
        setProjects(projectsData || []);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }

      try {
        const userStoryRes = await fetch(`${API_BASE_URL}/api/userStory`);
        const userStories = await userStoryRes.json();

        const userStoriesWithDetails = await Promise.all(
          (userStories || []).map(async (userStory) => {
            if (userStory?.id) {
              try {
                const [projectRes, sprintRes] = await Promise.all([
                  fetch(
                    `${API_BASE_URL}/api/userStory/project/${userStory.id}`
                  ),
                  fetch(
                    `${API_BASE_URL}/api/userStory/sprint/${userStory.id}`
                  ),
                ]);

                const project = await projectRes.json().catch(() => null);
                const sprint = await sprintRes.json().catch(() => null);

                return { ...userStory, project, sprint };
              } catch (error) {
                console.error(
                  `Error fetching details for user story ${userStory.id}:`,
                  error
                );
                return { ...userStory, project: null, sprint: null };
              }
            }
            return null;
          })
        );

        setUserStories(userStoriesWithDetails.filter(Boolean));
      } catch (error) {
        console.error("Error fetching user stories:", error);
      }
    })();
  }, []);

  const handleCreateSprint = async () => {
    if (
      !newSprint.name ||
      !newSprint.description ||
      !newSprint.endDate ||
      !newSprint.projectId
    )
      return;

    const sprintData = {
      ...newSprint,
      startDate: new Date().toISOString().split("T")[0],
      state: "TO_DO",
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/sprint/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sprintData),
      });

      if (response.ok) {
        const createdSprint = await response.json();
        const projectResponse = await fetch(
          `${API_BASE_URL}/api/sprint/project/${createdSprint.id}`
        );
        const project = await projectResponse.json();
        const updatedSprint = { ...createdSprint, project };
        setSprints([...sprints, updatedSprint]);
        setNewSprint({
          name: "",
          description: "",
          endDate: "",
          projectId: "",
        });
      }
    } catch (error) {
      console.error("Error creating sprint:", error);
    }
  };

  const updateSprintState = async (event, sprintId, newState) => {
    event.stopPropagation();
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/sprint/changeState/${sprintId}?newState=${newState}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: newState }),
        }
      );

      if (response.ok) {
        setSprints(
          sprints.map((sprint) =>
            sprint.id === sprintId ? { ...sprint, state: newState } : sprint
          )
        );
      }
    } catch (error) {
      console.error("Error updating sprint state:", error);
    }
  };

  const deleteSprint = async (event, sprintId) => {
    event.stopPropagation();
    try {
      await fetch(`${API_BASE_URL}/api/sprint/delete/${sprintId}`, {
        method: "DELETE",
      });
      setSprints(sprints.filter((sprint) => sprint.id !== sprintId));
    } catch (error) {
      console.error("Error deleting sprint:", error);
    }
  };

  const handleEditSprint = (event, sprint) => {
    event.stopPropagation();
    setSelectedSprint(sprint);
    setEditedSprint({ ...sprint });
    setEditPopup(true);
  };

  const handleSaveChanges = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/sprint/update/${editedSprint.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editedSprint),
        }
      );
      if (response.ok) {
        setSprints(
          sprints.map((sprint) =>
            sprint.id === editedSprint.id ? editedSprint : sprint
          )
        );
        setEditPopup(false);
      }
    } catch (error) {
      console.error("Error updating user story:", error);
    }
  };

  const displayedSprints = sprints.filter(
    (sprint) =>
      !selectedProjectFilter ||
      (sprint.project && sprint.project.id === parseInt(selectedProjectFilter))
  );

  return (
    <div className="app">
      <Header />
      <div className="sprint-main-content">
        <h2 className="sprint-title">Sprint Management</h2>

        <div className="new-sprint-container">
          <h3 className="new-sprint-title">Create New Sprint</h3>
          <div className="new-sprint-form-group">
            <input
              type="text"
              placeholder="Sprint Name"
              value={newSprint.name}
              onChange={(e) =>
                setNewSprint({ ...newSprint, name: e.target.value })
              }
              className="new-sprint-input-field"
            />
            <input
              type="text"
              placeholder="Description"
              value={newSprint.description}
              onChange={(e) =>
                setNewSprint({ ...newSprint, description: e.target.value })
              }
              className="new-sprint-input-field"
            />
            <input
              type="date"
              value={newSprint.endDate}
              onChange={(e) =>
                setNewSprint({ ...newSprint, endDate: e.target.value })
              }
              className="new-sprint-input-field"
            />
            <select
              value={newSprint.project_id}
              onChange={(e) =>
                setNewSprint({ ...newSprint, projectId: e.target.value })
              }
              className="new-sprint-input-field"
            >
              <option value="">Select Project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleCreateSprint}
              className="new-sprint-create-button"
            >
              Create
            </button>
          </div>
        </div>

        <div className="sprint-filters">
          <label className="sprint-project-filter">Filter by Project:</label>
          <select
            value={selectedProjectFilter}
            onChange={(e) => setSelectedProjectFilter(e.target.value)}
            className="sprint-filter-dropdown"
          >
            <option value="">Show all projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <h2 className="sprint-section-title">Active Sprints</h2>
        <div className="sprint-list">
          {displayedSprints
            .filter((sprint) => sprint.state !== "COMPLETED")
            .map((sprint) => (
              <div
                key={sprint.id}
                className="sprint-card"
                onClick={() => {
                  setSelectedSprint(sprint);
                  setSelectedPopup(true);
                }}
              >
                <div className="sprint-header">
                  <span>
                    Sprint {sprint.id} ({sprint.name})
                  </span>
                  <span className="sprint-status">({sprint.state})</span>
                </div>
                <h4>User Stories</h4>
                <div className="sprint-tasks">
                  {userStories
                    .filter(
                      (task) => task.sprint && task.sprint.id === sprint.id
                    )
                    .map((task) => (
                      <div key={task.id} className="sprint-task-item">
                        {task.name}
                      </div>
                    ))}
                </div>
                <div className="sprint-actions">
                  {sprint.state === "TO_DO" && (
                    <button
                      onClick={(e) =>
                        updateSprintState(e, sprint.id, "IN_PROGRESS")
                      }
                    >
                      ▶ Start
                    </button>
                  )}
                  {sprint.state === "IN_PROGRESS" && (
                    <button
                      onClick={(e) =>
                        updateSprintState(e, sprint.id, "COMPLETED")
                      }
                    >
                      ⏹ End
                    </button>
                  )}
                  <button onClick={(e) => handleEditSprint(e, sprint)}>
                    Edit
                  </button>
                  <button onClick={(e) => deleteSprint(e, sprint.id)}>
                    Drop
                  </button>
                </div>
              </div>
            ))}
        </div>

        <h2 className="sprint-section-title">Completed Sprints</h2>
        <div className="sprint-list">
          {displayedSprints
            .filter((sprint) => sprint.state === "COMPLETED")
            .map((sprint) => (
              <div
                key={sprint.id}
                className="sprint-card"
                onClick={() => {
                  setSelectedSprint(sprint);
                  setSelectedPopup(true);
                }}
              >
                <div className="sprint-header">
                  <span>
                    Sprint {sprint.id} ({sprint.name})
                  </span>
                  <span className="sprint-status">({sprint.state})</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      <SelectedPopup trigger={selectedPopup} setTrigger={setSelectedPopup}>
        {selectedSprint && (
          <div>
            <p>
              <strong>Name: </strong> {selectedSprint.name}
            </p>
            <p>
              <strong>Description: </strong> {selectedSprint.description}
            </p>
            <p>
              <strong>Start Date: </strong>{" "}
              {formatDate(selectedSprint.startDate)}
            </p>
            <p>
              <strong>End Date: </strong> {formatDate(selectedSprint.endDate)}
            </p>
            <p>
              <strong>Project: </strong> {selectedSprint.project.name}
            </p>
            <p>
              <strong>Status: </strong> {selectedSprint.state}
            </p>
            <p>
              <strong>User Stories :</strong>
              {userStories
                .filter(
                  (task) => task.sprint && task.sprint.id === selectedSprint.id
                )
                .map((task) => (
                  <div key={task.id} className="sprint-task-item">
                    {task.name}
                  </div>
                ))}
            </p>
          </div>
        )}
      </SelectedPopup>

      <SelectedPopup trigger={editPopup} setTrigger={setEditPopup}>
        {editedSprint && (
          <div>
            <h3 className="sprint-edit-popup">Edit User Story</h3>
            <input
              type="text"
              className="sprint-popup-input"
              value={editedSprint.name || ""}
              onChange={(e) =>
                setEditedSprint({ ...editedSprint, name: e.target.value })
              }
            />
            <input
              type="text"
              className="sprint-popup-input"
              value={editedSprint.description || ""}
              onChange={(e) =>
                setEditedSprint({
                  ...editedSprint,
                  description: e.target.value,
                })
              }
            />
            <input
              type="date"
              className="sprint-popup-input"
              value={editedSprint.endDate || ""}
              onChange={(e) =>
                setEditedSprint({
                  ...editedSprint,
                  endDate: e.target.value,
                })
              }
            />
            <div className="sprint-save-btn-container">
              <button className="sprint-save-btn" onClick={handleSaveChanges}>
                Save
              </button>
            </div>
          </div>
        )}
      </SelectedPopup>
    </div>
  );
}
