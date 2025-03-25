import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import SelectedPopup from "./SelectedPopup";
import "../styles/Projects.css";
import { FaCheckCircle } from "react-icons/fa";
import { FaUsers } from "react-icons/fa";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    endDate: "",
  });
  const [users, setUsers] = useState([]);
  const [scrumMasterId, setScrumMasterId] = useState("");
  const [selectedPopup, setSelectedPopup] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editPopup, setEditPopup] = useState(false);
  const [editMembersPopup, setEditMembersPopup] = useState(false);
  const [editedProject, setEditedProject] = useState({});

  const [productOwner, setProductOwner] = useState(null);
  const [scrumMaster, setScrumMaster] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedNewMember, setSelectedNewMember] = useState("");
  const stringUserId = localStorage.getItem("userId");
  const currentUserId = parseInt(stringUserId);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/project`)
      .then((res) => res.json())
      .then(async (projects) => {
        const updatedProjects = await Promise.all(
          projects.map(async (project) => {
            // Fetch Product Owner
            const productOwnerRes = await fetch(
              `${API_BASE_URL}/api/project/${project.id}/productOwner`
            );
            const productOwner = productOwnerRes.ok
              ? await productOwnerRes.json()
              : null;

            // Fetch Scrum Master
            const scrumMasterRes = await fetch(
              `${API_BASE_URL}/api/project/${project.id}/scrumMaster`
            );
            const scrumMaster = scrumMasterRes.ok
              ? await scrumMasterRes.json()
              : null;

            // Ensure completed projects are updated
            const updatedState =
              new Date(project.endDate) < new Date() &&
              project.state !== "COMPLETED"
                ? "COMPLETED"
                : project.state;

            return {
              ...project,
              state: updatedState,
              product_owner_id: productOwner?.id || null,
              scrum_master_id: scrumMaster?.id || null,
            };
          })
        );

        setProjects(updatedProjects);
      })
      .catch((error) => console.error("Error fetching projects:", error));

    fetch(`${API_BASE_URL}/api/auth`)
      .then((res) => res.json())
      .then(setUsers)
      .catch((error) => console.error("Error fetching users:", error));
  }, []);

  const handleCompleteProject = async (event, id) => {
    event.stopPropagation();
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/project/changeState/${id}/${currentUserId}?newState=COMPLETED`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        setProjects(
          projects.map((proj) =>
            proj.id === id ? { ...proj, state: "COMPLETED" } : proj
          )
        );
      }
    } catch (error) {
      console.error("Error updating project:", error);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name || !newProject.description || !newProject.endDate)
      return;
    const newEntry = {
      ...newProject,
      startDate: new Date().toISOString().split("T")[0],
      state: "IN_PROGRESS",
    };

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/project/create/${currentUserId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newEntry),
        }
      );

      if (response.ok) {
        const createdProject = await response.json();
        setProjects([...projects, createdProject]);
        const scrumMasterResponse = await fetch(
          `${API_BASE_URL}/api/project/${createdProject.id}/setScrumMaster/${scrumMasterId}/${currentUserId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (scrumMasterResponse.ok) {
          console.log("Scrum Master set successfully");
        } else {
          console.error("Failed to set Scrum Master");
        }

        setNewProject({
          name: "",
          description: "",
          endDate: "",
        });
        setScrumMasterId("");
      }
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  const handleDropProject = async (event, id) => {
    event.stopPropagation();
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/project/delete/${id}/${currentUserId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setProjects(projects.filter((project) => project.id !== id));
      } else {
        console.error("Failed to delete project");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  const handleSelectedProject = async (project) => {
    setSelectedProject(project);
    setSelectedPopup(true);

    try {
      // Fetch Product Owner
      const resPO = await fetch(
        `${API_BASE_URL}/api/project/${project.id}/productOwner`
      );
      if (resPO.ok) {
        const po = await resPO.json();
        setProductOwner(po);
      }

      // Fetch Scrum Master
      const resSM = await fetch(
        `${API_BASE_URL}/api/project/${project.id}/scrumMaster`
      );
      if (resSM.ok) {
        const sm = await resSM.json();
        setScrumMaster(sm);
      }

      // Fetch Team Members
      const resTM = await fetch(
        `${API_BASE_URL}/api/project/${project.id}/teamMembers`
      );
      if (resTM.ok) {
        const members = await resTM.json();
        setTeamMembers(members);
      }
    } catch (error) {
      console.error("Error fetching project details:", error);
    }
  };

  const handleEditProject = async (event, project) => {
    event.stopPropagation();
    setSelectedProject(project);
    setEditedProject({ ...project });
    setEditPopup(true);
  };

  const handleEditMembers = async (event, project) => {
    event.stopPropagation();
    setSelectedProject(project);
    setEditedProject({ ...project });
    setEditMembersPopup(true);

    // Fetch current team members
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/project/${project.id}/teamMembers`
      );
      if (res.ok) {
        const members = await res.json();
        setTeamMembers(members);

        // Filter available users to exclude team members
        const available = users.filter(
          (user) => !members.some((member) => member.id === user.id)
        );
        setAvailableUsers(available);
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  };

  const handleAddTeamMember = async () => {
    if (!selectedNewMember) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/project/${editedProject.id}/addMember/${selectedNewMember}/${currentUserId}`,
        { method: "POST" }
      );

      if (response.ok) {
        const newMember = users.find(
          (user) => user.id === parseInt(selectedNewMember)
        );
        setTeamMembers([...teamMembers, newMember]);
        setAvailableUsers(
          availableUsers.filter(
            (user) => user.id !== parseInt(selectedNewMember)
          )
        );
        setSelectedNewMember("");
      }
    } catch (error) {
      console.error("Error adding team member:", error);
    }
  };

  const handleRemoveTeamMember = async (memberId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/project/${editedProject.id}/removeMember/${memberId}/${currentUserId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setTeamMembers(teamMembers.filter((member) => member.id !== memberId));
        const removedUser = users.find((user) => user.id === memberId);
        setAvailableUsers([...availableUsers, removedUser]);
      }
    } catch (error) {
      console.error("Error removing team member:", error);
    }
  };

  const handleSaveChanges = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/project/update/${editedProject.id}/${currentUserId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editedProject),
        }
      );

      if (response.ok) {
        setProjects(
          projects.map((proj) =>
            proj.id === editedProject.id ? editedProject : proj
          )
        );
        setEditPopup(false);
      }
    } catch (error) {
      console.error("Error updating project:", error);
    }
  };

  return (
    <div className="app">
      <Header />

      <div className="new-project-container">
        <h2 className="main-title">Projects Manager</h2>

        {/* New Project Form */}
        <div className="new-project">
          <h3 className="new-project-title">New Project</h3>
          <div className="new-project-form-group">
            <input
              type="text"
              placeholder="Project Name"
              className="new-project-input-field"
              value={newProject.name}
              onChange={(e) =>
                setNewProject({ ...newProject, name: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Project Description"
              className="new-project-input-field"
              value={newProject.description}
              onChange={(e) =>
                setNewProject({ ...newProject, description: e.target.value })
              }
              required
            />
            <input
              type="date"
              className="new-project-input-field"
              value={newProject.endDate}
              onChange={(e) =>
                setNewProject({ ...newProject, endDate: e.target.value })
              }
              required
            />
            <select //scrum master
              value={scrumMasterId}
              onChange={(e) => setScrumMasterId(e.target.value)}
              className="new-project-input-field"
            >
              <option value="">Select Scrum Master</option>
              {users
                .filter((user) => user.id !== currentUserId)
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.userName}
                  </option>
                ))}
            </select>
            <button
              className="new-project-create-button"
              onClick={handleCreateProject}
            >
              Create
            </button>
          </div>
        </div>

        {/* Project Backlog Table */}
        <div class="new-project-container">
          <h2 class="project-backlog-title">Project Backlog</h2>
          <ul class="project-backlog-responsive-table">
            <li class="project-backlog-table-header">
              <div class="project-backlog-col col-1">Project Name</div>
              <div class="project-backlog-col col-2">Project Description</div>
              <div class="project-backlog-col col-3">Start Date</div>
              <div class="project-backlog-col col-4">End Date</div>
              <div class="project-backlog-col col-5">Status</div>
              <div class="project-backlog-col col-6">Actions</div>
            </li>
            <div class="project-backlog-container">
              {projects.map((project, index) => (
                <li
                  key={index}
                  class="project-backlog-table-row"
                  onClick={() => handleSelectedProject(project)}
                >
                  <div
                    class="project-backlog-col col-1"
                    data-label="Project Name"
                  >
                    {project.name.length > 15
                      ? project.name.substring(0, 15) + "..."
                      : project.name}
                  </div>
                  <div
                    class="project-backlog-col col-2"
                    data-label="Project Description"
                  >
                    {project.description.length > 20
                      ? project.description.substring(0, 20) + "..."
                      : project.description}
                  </div>
                  <div
                    class="project-backlog-col col-3"
                    data-label="Start Date"
                  >
                    {project.startDate.split("T")[0]}
                  </div>
                  <div class="project-backlog-col col-4" data-label="End Date">
                    {project.endDate.split("T")[0]}
                  </div>
                  <div class="project-backlog-col col-5" data-label="Status">
                    {project.state}
                  </div>
                  <div class="col col-6 action-buttons" data-label="Actions">
                    <button
                      className="project-backlog-edit-button"
                      onClick={(e) => handleEditProject(e, project)}
                    >
                      Edit
                    </button>
                    <button
                      className="project-backlog-edit-button"
                      onClick={(e) => handleEditMembers(e, project)}
                    >
                      <FaUsers className="project-backlog-edit-icon" />
                    </button>
                    <button
                      className="project-backlog-drop-button"
                      onClick={(e) => handleDropProject(e, project.id)}
                    >
                      Drop
                    </button>
                    <button
                      className={`project-backlog-complete-button ${
                        project.state === "COMPLETED" ? "completed" : ""
                      }`}
                      onClick={(e) => handleCompleteProject(e, project.id)}
                      disabled={project.state === "COMPLETED"}
                      title={
                        project.state === "COMPLETED"
                          ? "PROJECT IS ALREADY COMPLETED !"
                          : ""
                      }
                    >
                      <FaCheckCircle className="project-backlog-complete-icon" />
                    </button>
                  </div>
                </li>
              ))}
            </div>
          </ul>
        </div>
      </div>
      <SelectedPopup trigger={selectedPopup} setTrigger={setSelectedPopup}>
        {selectedProject && (
          <div>
            <p>
              <strong>Name:</strong> {selectedProject.name}
            </p>
            <p>
              <strong>Description:</strong> {selectedProject.description}
            </p>
            <p>
              <strong>Start Date:</strong>{" "}
              {selectedProject.startDate.split("T")[0]}
            </p>
            <p>
              <strong>End Date:</strong> {selectedProject.endDate.split("T")[0]}
            </p>
            <p>
              <strong>Status:</strong> {selectedProject.state}
            </p>
            {/* Product Owner */}
            <div>
              <h3>Product Owner</h3>
              {productOwner ? (
                <p>{productOwner.userName}</p>
              ) : (
                <p>No product owner assigned</p>
              )}
            </div>

            {/* Scrum Master */}
            <div>
              <h3>Scrum Master</h3>
              {scrumMaster ? (
                <p>{scrumMaster.userName}</p>
              ) : (
                <p>No scrum master assigned</p>
              )}
            </div>

            {/* Team Members */}
            <div>
              <h3>Team Members</h3>
              {teamMembers.length > 0 ? (
                <ul>
                  {teamMembers.map((member) => (
                    <li key={member.id}>{member.userName}</li>
                  ))}
                </ul>
              ) : (
                <p>No team members assigned</p>
              )}
            </div>
          </div>
        )}
      </SelectedPopup>

      <SelectedPopup trigger={editPopup} setTrigger={setEditPopup}>
        {editedProject && (
          <div>
            <h3 className="edit-popup">Edit Project</h3>
            <input
              type="text"
              className="popup-input"
              value={editedProject.name || ""}
              onChange={(e) =>
                setEditedProject({ ...editedProject, name: e.target.value })
              }
            />
            <input
              type="text"
              className="popup-input"
              value={editedProject.description || ""}
              onChange={(e) =>
                setEditedProject({
                  ...editedProject,
                  description: e.target.value,
                })
              }
            />
            <input
              type="date"
              className="popup-input"
              value={editedProject.endDate || ""}
              onChange={(e) =>
                setEditedProject({ ...editedProject, endDate: e.target.value })
              }
            />
            <div className="save-btn-container">
              <button className="save-btn" onClick={handleSaveChanges}>
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
        {editedProject && (
          <div>
            <div>
              <h3>Add Team Member</h3>
              <select
                value={selectedNewMember}
                onChange={(e) => setSelectedNewMember(e.target.value)}
                className="popup-input"
              >
                <option value="">Select User</option>
                {console.log(editedProject)}
                {availableUsers
                  .filter(
                    (user) =>
                      user.id !== editedProject.product_owner_id &&
                      user.id !== editedProject.scrum_master_id
                  )
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.userName}
                    </option>
                  ))}
              </select>
              <button onClick={handleAddTeamMember}>Add</button>

              <h3>Current Team Members</h3>
              <ul>
                {teamMembers.map((member) => (
                  <li key={member.id}>
                    {member.userName}
                    <button onClick={() => handleRemoveTeamMember(member.id)}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </SelectedPopup>
    </div>
  );
}
