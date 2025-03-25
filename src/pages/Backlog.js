import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import SelectedPopup from "./SelectedPopup";
import "../styles/Backlog.css";
import { FaFileCirclePlus } from "react-icons/fa6";

export default function Backlog() {
  const [userStories, setUserStories] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedPopup, setSelectedPopup] = useState(false);
  const [selectedUserStory, setSelectedUserStory] = useState(null);
  const [selectedSprints, setSelectedSprints] = useState(null);
  const [editPopup, setEditPopup] = useState(false);
  const [editedUserStory, setEditedUserStory] = useState({});
  const [selectedProjectFilter, setSelectedProjectFilter] = useState("");
  const [newUserStory, setNewUserStory] = useState({
    name: "",
    description: "",
    priority: "",
    estimatedHours: "",
    projectId: "",
    collaborators: [],
    sprintId: null,
  });
  const [popupVisible, setPopupVisible] = useState(false);
  const [selectedUserStoryId, setSelectedUserStoryId] = useState(null);
  const [sprints, setSprints] = useState([]);

  const isSelected = (sprintId) => {
    return Array.isArray(selectedSprints) && selectedSprints.includes(sprintId);
  };

  const handleOpenPopup = (userStoryId) => {
    setSelectedUserStoryId(userStoryId);
    setPopupVisible(true);
  };

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const handleAssignUserStories = async () => {
    if (!selectedUserStoryId || selectedSprints.length === 0) return;

    try {
      await Promise.all(
        selectedSprints.map((sprintId) =>
          fetch(
            `${API_BASE_URL}/api/sprint/${sprintId}/addUserStory/${selectedUserStoryId}`,
            { method: "PUT", headers: { "Content-Type": "application/json" } }
          )
        )
      );
      const userStoryRes = await fetch(`${API_BASE_URL}/api/userStory`);
      const updatedUserStories = await userStoryRes.json();

      const userStoriesWithDetails = await Promise.all(
        (updatedUserStories || []).map(async (userStory) => {
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

      const filteredStories = userStoriesWithDetails
        .filter(Boolean)
        .filter(
          (story) =>
            story.state !== "IN_PROGRESS" && story.state !== "COMPLETED"
        );

      setUserStories(filteredStories);

      setPopupVisible(false);
      setSelectedSprints([]);
    } catch (error) {
      console.error("Error assigning user stories:", error);
    }
  };

  const priorityOrder = {
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/project`)
      .then((res) => res.json())
      .then((result) => setProjects(result))
      .catch((error) => console.error("Error fetching projects:", error));
  }, []);

  useEffect(() => {
    const fetchSprints = async () => {
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
    };

    fetchSprints();
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/userStory`) // Fetch all user stories first
      .then((res) => res.json())
      .then((stories) => {
        // Fetch both project and sprint details
        const fetchDetails = stories.map((story) => {
          if (story.id !== undefined && story.id !== null) {
            return Promise.all([
              fetch(`${API_BASE_URL}/api/userStory/project/${story.id}`)
                .then((res) => res.json())
                .catch(() => null),
              fetch(`${API_BASE_URL}/api/userStory/sprint/${story.id}`)
                .then((res) => res.json())
                .catch(() => null),
            ])
              .then(([project, sprint]) => ({ ...story, project, sprint })) // Attach both project and sprint
              .catch((error) => {
                console.error(
                  `Error fetching details for story ${story.id}:`,
                  error
                );
                return { ...story, project: null, sprint: null };
              });
          } else {
            return { ...story, project: null, sprint: null }; // Default values
          }
        });

        return Promise.all(fetchDetails);
      })
      .then((storiesWithDetails) => {
        // Filter out IN_PROGRESS and COMPLETED user stories
        const filteredStories = storiesWithDetails.filter(
          (story) =>
            story.state !== "IN_PROGRESS" && story.state !== "COMPLETED"
        );
        setUserStories(filteredStories);
      })
      .catch((error) => console.error("Error fetching user stories:", error));
  }, []);

  const handleCreateUserStory = async () => {
    if (
      !newUserStory.name ||
      !newUserStory.description ||
      !newUserStory.priority ||
      newUserStory.estimatedHours <= 0 ||
      !newUserStory.projectId
    )
      return;

    const newEntry = {
      ...newUserStory,
      startDate: new Date().toISOString().split("T")[0],
      state: "TO_DO",
    };

    const stringUserId = localStorage.getItem("userId");
    const userId = parseInt(stringUserId);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/userStory/create/${userId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newEntry),
        }
      );

      if (response.ok) {
        const createdUserStory = await response.json();
        const projectResponse = await fetch(
          `${API_BASE_URL}/api/userStory/project/${createdUserStory.id}`
        );
        const project = await projectResponse.json();
        const updatedUserStory = { ...createdUserStory, project };
        setUserStories([...userStories, updatedUserStory]);
        setNewUserStory({
          name: "",
          description: "",
          priority: "",
          estimatedHours: "",
          projectId: "",
          collaborators: [],
          sprintId: null,
        });
      }
    } catch (error) {
      console.error("Error creating user story:", error);
    }
  };

  const handleDropUserStory = async (event, id) => {
    event.stopPropagation();
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/userStory/delete/${id}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        setUserStories(userStories.filter((userStory) => userStory.id !== id));
      }
    } catch (error) {
      console.error("Error deleting user story:", error);
    }
  };

  const handleEditUserStory = async (event, userStory) => {
    event.stopPropagation();
    setSelectedUserStory(userStory);
    setEditedUserStory({ ...userStory });
    setEditPopup(true);
  };

  const handleSaveChanges = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/userStory/update/${editedUserStory.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editedUserStory),
        }
      );
      if (response.ok) {
        setUserStories(
          userStories.map((story) =>
            story.id === editedUserStory.id ? editedUserStory : story
          )
        );
        setEditPopup(false);
      }
    } catch (error) {
      console.error("Error updating user story:", error);
    }
  };

  const activeProjects = projects.filter((project) =>
    userStories.some(
      (story) =>
        story.project &&
        story.project.id === project.id &&
        story.state !== "IN_PROGRESS" &&
        story.state !== "COMPLETED"
    )
  );

  const displayedUserStories = userStories
    .filter(
      (story) =>
        !selectedProjectFilter ||
        (story.project && story.project.id === parseInt(selectedProjectFilter))
    )
    .sort(
      (a, b) =>
        (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4)
    );

  return (
    <div className="app">
      <Header />
      <div className="new-userstory-container">
        <h2 className="userstory-title">Product Backlog</h2>
        <div className="new-userstory">
          <h3 className="new-userstory-title">New User Story</h3>
          <div className="new-userstory-form-group">
            <input
              type="text"
              placeholder="User Story Name"
              value={newUserStory.name}
              onChange={(e) =>
                setNewUserStory({ ...newUserStory, name: e.target.value })
              }
              className="new-userstory-input-field"
              required
            />
            <input
              type="text"
              placeholder="Description"
              value={newUserStory.description}
              onChange={(e) =>
                setNewUserStory({
                  ...newUserStory,
                  description: e.target.value,
                })
              }
              className="new-userstory-input-field"
              required
            />
            <select
              value={newUserStory.priority}
              onChange={(e) =>
                setNewUserStory({ ...newUserStory, priority: e.target.value })
              }
              className="new-userstory-input-field"
              required
            >
              <option value="">Select Priority</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
            <input
              type="number"
              placeholder="Estimated Hours"
              value={newUserStory.estimatedHours}
              onChange={(e) => {
                const value = Math.max(0, parseInt(e.target.value) || ""); // Ensure positive numbers
                setNewUserStory({ ...newUserStory, estimatedHours: value });
              }}
              className="new-userstory-input-field"
              required
            />
            <select
              value={newUserStory.projectId}
              onChange={(e) =>
                setNewUserStory({
                  ...newUserStory,
                  projectId: e.target.value,
                })
              }
              className="new-userstory-input-field"
              required
            >
              <option value="">Select Project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <button
              className="new-userstory-create-button"
              onClick={handleCreateUserStory}
            >
              Create
            </button>
          </div>
        </div>
        <div className="userstory-filter-container">
          <label className="userstory-projectFilter">Filter by Project:</label>
          <select
            id="projectFilter"
            value={selectedProjectFilter}
            onChange={(e) => setSelectedProjectFilter(e.target.value)}
            className="userstory-filter-dropdown"
          >
            <option value="">Show all Projects</option>
            {activeProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        <div className="new-userstory-container">
          <h3 class="userstory-list-title">All User Stories</h3>
          <ul className="userstory-responsive-table">
            <li className="userstory-table-header">
              <div className="userstory-col col-1">Name</div>
              <div className="userstory-col col-2">Description</div>
              <div className="userstory-col col-3">Priority</div>
              <div className="userstory-col col-4">Estimated Hours</div>
              <div className="userstory-col col-5">Project</div>
              <div className="userstory-col col-6">Status</div>
              <div className="userstory-col col-7">Actions</div>
            </li>
            <div class="userstory-container">
              {displayedUserStories.map((userStory) => (
                <li
                  className="userstory-table-row"
                  key={userStory.id}
                  onClick={() => {
                    setSelectedUserStory(userStory);
                    setSelectedPopup(true);
                  }}
                >
                  <div className="userstory-col col-1">
                    {userStory.name.length > 10
                      ? userStory.name.substring(0, 10) + "..."
                      : userStory.name}
                  </div>
                  <div className="userstory-col col-2">
                    {userStory.description.length > 20
                      ? userStory.description.substring(0, 20) + "..."
                      : userStory.description}
                  </div>
                  <div className="userstory-col col-3">
                    {userStory.priority.charAt(0).toUpperCase() +
                      userStory.priority.slice(1).toLowerCase()}
                  </div>
                  <div className="userstory-col col-4">
                    {userStory.estimatedHours}
                  </div>
                  <div className="userstory-col col-5">
                    {userStory.project
                      ? userStory.project.name.length > 20
                        ? userStory.project.name.substring(0, 20) + "..."
                        : userStory.project.name
                      : "N/A"}
                  </div>
                  <div className="userstory-col col-6">{userStory.state}</div>
                  <div className="userstory-col col-7 action-buttons">
                    {console.log(userStory)}
                    <button
                      className={`userstory-sprint-button ${
                        userStory.sprint ? "disabled" : ""
                      }`}
                      onClick={(e) => {
                        console.log(userStory);
                        if (!userStory.sprint) {
                          e.stopPropagation();
                          handleOpenPopup(userStory.id);
                        }
                      }}
                      disabled={!!userStory.sprint}
                      title={
                        userStory.sprint
                          ? "USER STORY HAS ALREADY A SPRINT ASSIGNED TO IT !"
                          : ""
                      }
                    >
                      <FaFileCirclePlus className="sprint-icon" />
                    </button>
                    <button
                      className="userstory-edit-button"
                      onClick={(e) => handleEditUserStory(e, userStory)}
                    >
                      Edit
                    </button>
                    <button
                      className="userstory-drop-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDropUserStory(e, userStory.id);
                      }}
                    >
                      Drop
                    </button>
                  </div>
                </li>
              ))}
            </div>
          </ul>
        </div>
      </div>

      <SelectedPopup trigger={selectedPopup} setTrigger={setSelectedPopup}>
        {selectedUserStory && (
          <div>
            <p>
              <strong>Name: </strong> {selectedUserStory.name}
            </p>
            <p>
              <strong>Description: </strong> {selectedUserStory.description}
            </p>
            <p>
              <strong>Priority: </strong>
              {selectedUserStory.priority.charAt(0).toUpperCase() +
                selectedUserStory.priority.slice(1).toLowerCase()}
            </p>
            <p>
              <strong>Estimated Hours: </strong>{" "}
              {selectedUserStory.estimatedHours}
            </p>
            <p>
              <strong>Project: </strong> {selectedUserStory.project.name}
            </p>
            <p>
              <strong>Status: </strong> {selectedUserStory.state}
            </p>
          </div>
        )}
      </SelectedPopup>

      <SelectedPopup trigger={editPopup} setTrigger={setEditPopup}>
        {editedUserStory && (
          <div>
            <h3 className="userstory-edit-popup">Edit User Story</h3>
            <input
              type="text"
              className="userstory-popup-input"
              value={editedUserStory.name || ""}
              onChange={(e) =>
                setEditedUserStory({ ...editedUserStory, name: e.target.value })
              }
            />
            <input
              type="text"
              className="userstory-popup-input"
              value={editedUserStory.description || ""}
              onChange={(e) =>
                setEditedUserStory({
                  ...editedUserStory,
                  description: e.target.value,
                })
              }
            />
            <select
              value={editedUserStory.priority}
              onChange={(e) =>
                setEditedUserStory({
                  ...editedUserStory,
                  priority: e.target.value,
                })
              }
              className="userstory-popup-input"
            >
              <option value="">Select Priority</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
            <input
              type="number"
              className="userstory-popup-input"
              value={editedUserStory.estimatedHours || ""}
              onChange={(e) =>
                setEditedUserStory({
                  ...editedUserStory,
                  estimatedHours: e.target.value,
                })
              }
            />
            <div className="userstory-save-btn-container">
              <button
                className="userstory-save-btn"
                onClick={handleSaveChanges}
              >
                Save
              </button>
            </div>
          </div>
        )}
      </SelectedPopup>

      {popupVisible && (
        <SelectedPopup trigger={popupVisible} setTrigger={setPopupVisible}>
          <h3>Select Sprint</h3>
          <ul>
            {sprints
              .filter((sprint) => sprint.state !== "COMPLETED")
              .map((sprint) => (
                <li key={sprint.id}>
                  <input
                    type="checkbox"
                    value={sprint.id}
                    checked={isSelected(sprint.id)}
                    onChange={(e) => {
                      const sprintId = sprint.id;
                      setSelectedSprints((prev) => {
                        const updatedSelection = Array.isArray(prev)
                          ? [...prev]
                          : [];
                        return e.target.checked
                          ? [...updatedSelection, sprintId]
                          : updatedSelection.filter((id) => id !== sprintId);
                      });
                    }}
                  />
                  {sprint.name}
                </li>
              ))}
          </ul>
          <button onClick={handleAssignUserStories}>Confirm</button>
        </SelectedPopup>
      )}
    </div>
  );
}
