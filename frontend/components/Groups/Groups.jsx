import React, { useEffect, useState } from "react"
import "../Friends/Friends.css";
import "./Groups.css";
import { fetchCreateGroup, fetchGroupsHistory } from "../helpers/apiHelper";
import Icon from '@mdi/react';
import { mdiPlusCircle } from '@mdi/js';

const CreateGroupModal = ({setOpenModal, setPage, setChatId}) => {
  const [errors, setErrors] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: []
  });

  const handleFormChange = (e) => {
    if(e.target.name === 'image') {
      setFormData({
        ...formData,
        [e.target.name]: e.target.files[0]
      });
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    }
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const body = new FormData();
      body.append('name', formData.name);
      body.append('description', formData.description);
      body.append('image', formData.image);
      const request = await fetchCreateGroup(body);
      if(request.success) {
        setOpenModal(false);
        setPage('group');
        setChatId(request.group_id);
      } else {
        setErrors(request.errors);
      }
    } catch (error) {
      setErrors(['There was an error with the API.']);
    }
  }


  return (
    <div className="create-group-modal" onClick={() => setOpenModal(false)}>
      <div className="create-group-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Create Group</h2>
        <form method='POST' onSubmit={(e) => handleFormSubmit(e)}>
          <label htmlFor="name">Name:</label>
          <input type="text" id="name" name="name" onChange={(e) => handleFormChange(e)}/>
          <input type="file" name="image" accept="image/*" id="image" onChange={(e) => handleFormChange(e)}/>
          <label htmlFor="description">Description:</label>
          <textarea id="description" name="description" onChange={(e) => handleFormChange(e)}/>
          <button type="submit">Create Group</button>
        </form>
      </div>
    </div>
  )
}

export const Groups = ({ setChatId, setPage }) => {
  const [groups, setGroups] = useState([]);
  const [errors, setErrors] = useState([]);
  const [openModal, setOpenModal] = useState(false);

  const fetchGroups = async () => {
    try {
      const request = await fetchGroupsHistory(0);
      if (request.success) {
        setGroups(request.groups);
      } else {
        setErrors([request.error]);
      }
    } catch (error) {
      setErrors['There was an error with the API.'];
    }
  }

  const handleGroup = (groupId) => {
    setChatId(groupId);
    setPage('group');
  }

  useEffect(() => {
    fetchGroups();
    const content = document.getElementById('content');
    if (content) content.classList.add('content_friends');
    return (() => content ? content.classList.remove('content_friends') : null);
  }, [])

  return (
    <>
      {openModal ? <CreateGroupModal setOpenModal={setOpenModal} setPage={setPage} setChatId={setChatId} /> : null}
      <div className="friends-container">
        <div className="groups_header">
          <h1>Groups</h1>
          <p onClick={() => setOpenModal(true)}><Icon path={mdiPlusCircle} size={2} /></p>
        </div>
        <div className="friends_list">
          {
            groups.map((group) => (
              <div className="friend_single" key={group._id} onClick={() => handleGroup(group._id)}>
                {
                  group.image && group.image.imageType !== '' ? (
                    <img
                      src={`http://localhost:3000/api/group/${group._id}/thumbnail/`}
                      alt="User Avatar"
                      className="user-img-icon"
                    />
                  ) : (
                    <img
                      src="https://www.gravatar.com/avatar/00000000000000000000000000000000?d=identicon&f=y"
                      alt="User Avatar"
                      className="user-img-icon"
                    />
                  )
                }
                <p>{group.name}</p>
              </div>
            ))
          }
        </div>
      </div>
    </>
  )
}