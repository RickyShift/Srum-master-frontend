import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import "../styles/UserStories.css";
import SelectedPopup from "./SelectedPopup";
import { FaUsers } from "react-icons/fa";

export default function UserStories() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("none");
  const [projectFilter, setProjectFilter] = useState("");
  const [sprintFilter, setSprintFilter] = useState("");
  const [editedTask, setEditedTask] = useState({});
  const [editPopup, setEditPopup] = useState(false);
  const [editMembersPopup, setEditMembersPopup] = useState(false);
  const [assignedMembers, setAssignedMembers] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [showRealHoursPopup, setShowRealHoursPopup] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [realHours, setRealHours] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const getAssignedMembers = async (userStoryId) => {
    const response = await fetch(
      `${API_BASE_URL}/api/userStory/users/${userStoryId}`
    );
    if (response.ok) {
      const assignedMembers = await response.json();
      return assignedMembers;
    } else {
      console.error("Error fetching assigned members");
      return [];
    }
  };

  const getProjectTeamMembers = async (projectId) => {
    const response = await fetch(
      `${API_BASE_URL}/api/project/${projectId}/teamMembers`
    );
    if (response.ok) {
      const teamMembers = await response.json();
      return teamMembers;
    } else {
      console.error("Error fetching team members");
      return [];
    }
  };

  const assignUserToUserStory = async (userStoryId, userId) => {
    const response = await fetch(
      `${API_BASE_URL}/api/userStory/${userStoryId}/assignUser/${userId}`,
      { method: "PUT" }
    );
    if (response.ok) {
      console.log("User assigned successfully");
      const assignedMembers = await getAssignedMembers(userStoryId);
      setAssignedMembers(assignedMembers);
    } else {
      console.error("Error assigning user");
    }
  };

  const removeUserFromUserStory = async (userStoryId, userId) => {
    const response = await fetch(
      `${API_BASE_URL}/api/userStory/${userStoryId}/removeUser/${userId}`,
      { method: "PUT" }
    );
    if (response.ok) {
      console.log("User removed successfully");
      // Update the user story with the removed user
      const assignedMembers = await getAssignedMembers(userStoryId);
      setAssignedMembers(assignedMembers);
    } else {
      console.error("Error removing user");
    }
  };

  const handleEditUserStory = async (event, userStory) => {
    event.stopPropagation();
    setEditedTask({ ...userStory });
    const assignedMembers = await getAssignedMembers(userStory.id);
    setAssignedMembers(assignedMembers);
    const teamMembers = await getProjectTeamMembers(userStory.project.id);
    setTeamMembers(teamMembers); // Update teamMembers state
    setEditPopup(true);
  };

  const handleEditMembers = async (event, userStory) => {
    event.stopPropagation();
    setEditedTask({ ...userStory });
    const assignedMembers = await getAssignedMembers(userStory.id);
    setAssignedMembers(assignedMembers);
    const teamMembers = await getProjectTeamMembers(userStory.project.id);
    setTeamMembers(teamMembers); // Update teamMembers state
    setEditMembersPopup(true);
  };

  const handleSaveChanges = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/userStory/update/${editedTask.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editedTask),
        }
      );
      if (response.ok) {
        setTasks(
          tasks.map((task) => (task.id === editedTask.id ? editedTask : task))
        );
        setEditPopup(false);
      }
    } catch (error) {
      console.error("Error updating user story:", error);
    }
  };

  const handleDropUserStory = async (id) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/userStory/delete/${id}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        setTasks(tasks.filter((task) => task.id !== id));
      }
    } catch (error) {
      console.error("Error deleting user story:", error);
    }
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/project`)
      .then((res) => res.json())
      .then((result) => setProjects(result))
      .catch((error) => console.error("Error fetching projects:", error));
    fetch(`${API_BASE_URL}/api/sprint`)
      .then((res) => res.json())
      .then((result) => setSprints(result))
      .catch((error) => console.error("Error fetching sprints:", error));
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/userStory`)
      .then((res) => res.json())
      .then((userStories) => {
        // Fetch projects and sprints for each user story
        const fetchDetails = userStories.map((userStory) => {
          if (userStory.id !== undefined && userStory.id !== null) {
            return Promise.all([
              fetch(
                `${API_BASE_URL}/api/userStory/project/${userStory.id}`
              )
                .then((res) => res.json())
                .catch((error) => {
                  console.error(
                    `Error fetching project for story ${userStory.id}:`,
                    error
                  );
                  return null;
                }),

              fetch(
                `${API_BASE_URL}/api/userStory/sprint/${userStory.id}`
              )
                .then((res) => res.json())
                .catch((error) => {
                  console.error(
                    `Error fetching sprint for story ${userStory.id}:`,
                    error
                  );
                  return null;
                }),
            ]).then(([project, sprint]) => ({ ...userStory, project, sprint }));
          } else {
            return { ...userStory, project: null, sprint: null };
          }
        });

        return Promise.all(fetchDetails);
      })
      .then((userStoriesWithDetails) => {
        setTasks(userStoriesWithDetails);
      })
      .catch((error) => console.error("Error fetching user stories:", error));
  }, []);

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDrop = async (e, newState) => {
    const taskId = e.dataTransfer.getData("taskId");
    const updatedTask = tasks.find((task) => task.id === parseInt(taskId));

    if (!updatedTask) return;

    // Create a copy of the task to avoid direct mutation
    const taskToUpdate = { ...updatedTask, state: newState };

    // First, update the task in the backend
    try {
      // If the state is "COMPLETED", open the real hours popup
      if (newState === "COMPLETED") {
        setSelectedTask(taskToUpdate);
        setShowRealHoursPopup(true);
      } else {
        setRealHours("");
        taskToUpdate.realHours = realHours;

        await fetch(`${API_BASE_URL}/api/userStory/update/${taskId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskToUpdate),
        });

        // Update the state in the backend after the task is updated
        await fetch(
          `${API_BASE_URL}/api/userStory/changeState/${taskId}?newState=${newState}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(taskToUpdate),
          }
        );

        // Update the task list in state after both the update and state change
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === parseInt(taskId) ? taskToUpdate : task
          )
        );
      }
    } catch (error) {
      console.error("Error updating task or changing state:", error);
    }
  };

  const saveRealHours = async (taskId, newState) => {
    const updatedTask = tasks.find((task) => task.id === taskId);

    if (!updatedTask) return;

    updatedTask.realHours = parseInt(realHours);

    try {
      // First, update the task in the backend
      await fetch(
        `${API_BASE_URL}/api/userStory/update/${updatedTask.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedTask),
        }
      );

      // Then, change the state of the task
      await fetch(
        `${API_BASE_URL}/api/userStory/changeState/${updatedTask.id}?newState=${newState}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedTask),
        }
      );

      // After updating the task, fetch the updated user stories
      const userStoriesResponse = await fetch(
        `${API_BASE_URL}/api/userStory`
      );
      const userStories = await userStoriesResponse.json();

      const fetchDetails = userStories.map((userStory) => {
        if (userStory.id) {
          return Promise.all([
            fetch(`${API_BASE_URL}/api/userStory/project/${userStory.id}`)
              .then((res) => res.json())
              .catch((error) => {
                console.error(
                  `Error fetching project for story ${userStory.id}:`,
                  error
                );
                return null;
              }),

            fetch(`${API_BASE_URL}/api/userStory/sprint/${userStory.id}`)
              .then((res) => res.json())
              .catch((error) => {
                console.error(
                  `Error fetching sprint for story ${userStory.id}:`,
                  error
                );
                return null;
              }),
          ]).then(([project, sprint]) => ({ ...userStory, project, sprint }));
        } else {
          return { ...userStory, project: null, sprint: null };
        }
      });

      const userStoriesWithDetails = await Promise.all(fetchDetails);
      setTasks(userStoriesWithDetails);
    } catch (error) {
      console.error("Error updating task or fetching user stories:", error);
    }

    // Close the real hours popup and reset input
    setShowRealHoursPopup(false);
    setRealHours("");
  };

  const filteredTasks = tasks
    .filter(
      (task) =>
        task &&
        task.name &&
        task.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((task) =>
      projectFilter ? task.project?.id.toString() === projectFilter : true
    )
    .filter((task) =>
      sprintFilter ? task.sprint?.id.toString() === sprintFilter : true
    )
    .sort((a, b) => {
      if (filter === "name") return a.name.localeCompare(b.name);
      if (filter === "priority") return b.priority - a.priority;
      return 0;
    });

  return (
    <div className="app">
      <Header />
      <main className="board-main-content">
        <h2 className="board-title">User Stories Manager</h2>

        <div className="board-controls">
          <input
            type="text"
            placeholder="Search user stories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select onChange={(e) => setProjectFilter(e.target.value)}>
            <option value="">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          <select onChange={(e) => setSprintFilter(e.target.value)}>
            <option value="">All Sprints</option>
            {sprints.map((sprint) => (
              <option key={sprint.id} value={sprint.id}>
                {sprint.name}
              </option>
            ))}
          </select>
        </div>

        <div className="board-task-board">
          {["TO_DO", "IN_PROGRESS", "COMPLETED"].map((state) => (
            <div
              key={state}
              className="board-task-column"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, state)}
            >
              <h3>{state}</h3>
              <div className="board-task-container">
                {filteredTasks
                  .filter((task) => task.state === state)
                  .map((task) => (
                    <div
                      key={task.id}
                      className="board-task-card"
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                    >
                      <div>
                        <p>
                          <strong>Name: </strong> {task.name}
                        </p>
                        <p>
                          <strong>Description: </strong> {task.description}
                        </p>
                        <p>
                          <strong>Project: </strong>{" "}
                          {task.project ? task.project.name : "N/A"}
                        </p>
                        <p>
                          <strong>Sprint: </strong>{" "}
                          {task.sprint ? task.sprint.name : "N/A"}
                        </p>
                        <p>
                          <strong>Estimated Hours: </strong>
                          {task.estimatedHours}
                        </p>
                        {task.state === "COMPLETED" && (
                          <p>
                            <strong>Real Hours: </strong>
                            {task.realHours ? task.realHours : "Not entered"}
                          </p>
                        )}
                        <p>
                          <strong>Priority: </strong>
                          {task.priority.charAt(0).toUpperCase() +
                            task.priority.slice(1).toLowerCase()}
                        </p>
                      </div>
                      <div className="task-actions">
                        <button
                          className="task-edit-button"
                          onClick={(e) => handleEditUserStory(e, task)}
                        >
                          Edit
                        </button>
                        <button
                          className="task-edit-button"
                          onClick={(e) => handleEditMembers(e, task)}
                        >
                          <FaUsers className="task-edit-icon" />
                        </button>
                        <button
                          className="task-drop-button"
                          onClick={() => handleDropUserStory(task.id)}
                        >
                          Drop
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </main>
      <SelectedPopup trigger={editPopup} setTrigger={setEditPopup}>
        {editedTask && (
          <div>
            <h3 className="task-edit-popup-1">Edit User Story</h3>
            <input
              type="text"
              className="task-popup-input"
              value={editedTask.name || ""}
              onChange={(e) =>
                setEditedTask({ ...editedTask, name: e.target.value })
              }
            />
            <input
              type="text"
              className="task-popup-input"
              value={editedTask.description || ""}
              onChange={(e) =>
                setEditedTask({ ...editedTask, description: e.target.value })
              }
            />
            <select
              value={editedTask.priority}
              onChange={(e) =>
                setEditedTask({ ...editedTask, priority: e.target.value })
              }
              className="task-popup-input"
            >
              <option value="">Select Priority</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
            <input
              type="date"
              className="task-popup-input"
              value={editedTask.endDate || ""}
              onChange={(e) =>
                setEditedTask({ ...editedTask, endDate: e.target.value })
              }
            />
            <div className="task-save-btn-container">
              <button className="task-save-btn" onClick={handleSaveChanges}>
                Save
              </button>
            </div>
          </div>
        )}
      </SelectedPopup>
      <SelectedPopup
        trigger={editMembersPopup}
        setTrigger={setEditMembersPopup}
      >
        {editedTask && (
          <div>
            <div className="collaborators-section">
              <h3>Assigned Members</h3>
              <ul>
                {assignedMembers.map((member) => (
                  <li key={member.id}>
                    {member.userName}
                    <button
                      onClick={() =>
                        removeUserFromUserStory(editedTask.id, member.id)
                      }
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>

              <h3>Add New Member</h3>
              <select
                onChange={(e) =>
                  assignUserToUserStory(editedTask.id, e.target.value)
                }
              >
                <option value="">Select a user</option>
                {teamMembers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.userName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </SelectedPopup>

      <SelectedPopup
        trigger={showRealHoursPopup}
        setTrigger={setShowRealHoursPopup}
      >
        {selectedTask && (
          <div>
            <div>
              <h3 className="task-edit-popup-1">
                Real Effort (by hours)
              </h3>
              <input
                className="task-popup-input"
                type="number"
                min="0"
                value={realHours}
                onChange={(e) => setRealHours(e.target.value)}
              />
              <div className="task-save-btn-container">
                <button
                  className="task-save-btn"
                  onClick={() => saveRealHours(selectedTask.id, "COMPLETED")}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </SelectedPopup>
    </div>
  );
}
