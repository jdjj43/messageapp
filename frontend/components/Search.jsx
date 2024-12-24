import React, { useEffect, useState } from "react";
import './Search.css';
import { fetchAddFriend, fetchDeleteFriend, fetchUserFriendsIds } from "./helpers/apiHelper";

export const Search = ({ searchResults, userSession, handleOProfileId }) => {
  const [userFriends, setUserFriends] = useState([]);
  const [errors, setErrors] = useState([]);
  useEffect(() => {
    const userFriendIds = async () => {
      const data = await fetchUserFriendsIds(userSession._id);
      if(data.success) {
        setUserFriends(data.friends);
      } else {
        setErrors([data.error]);
      }
    }
    userFriendIds();
    const content = document.getElementById('content');
    content.classList.add('search_content');
    return () => {
      content.classList.remove('search_content');
    }
  }, []);
  const handleAddFriend = async(e, userId) => {
    try {
      const response = await fetchAddFriend(userId);
      if(response.success) {
        setUserFriends([...userFriends, userId]);
        e.target.innerText = '✔️ Friends';
      } else {
        setErrors([...errors, response.message]);
      }
    } catch (error) {
      setErrors(['There was an error with the API.']);
    }
  }
  const handleDeleteFriend = async(e, userId) => {
    try {
      const response = await fetchDeleteFriend(userId);
      if(response.success) {
        setUserFriends(userFriends.filter((friend) => friend !== userId));
        e.target.innerText = 'Add Friend';
      } else {
        setErrors([...errors, response.message]);
      }
    } catch (error) {
      setErrors(['There was an error with the API.']);
    }
  }
  if (!searchResults.success) {
    return (
      <div className="search_no_users">
        <div className="search_no_users_text">
          <h1>Search</h1>
          <p>No users found.</p>
        </div>
      </div>
    )
  }

  // const userAddDBtn = document.getElementById('user_add_delete_btn');
  // if(userAddBtn) {
  //   userAddBtn.addEventListener
  // }

  const handleBtnHover = (e, isFriend) => {
    if(isFriend) {
      e.target.innerText = '✖️ Remove Friend';
    } else {
      e.target.innerText = 'Add Friend';
    }
  }

  const handleBtnOut = (e, isFriend) => {
    if(isFriend) {
      e.target.innerText = '✔️ Friends';
    } else {
      e.target.innerText = 'Add Friend';
    }
  }

  return (
    <div className="search_container">
      <h1>Search</h1>
      <div className="users_search">
        {searchResults.users.map((user) => (
          userSession._id !== user._id &&
          <div className="user_search" key={user._id}>
            <div className="user_search_image">
              { user.profile.profile_picture && user.profile.profile_picture.image_type !== "" ? (
                <img
                  src={`http://localhost:3000/api/user/profile/thumbnail/${user._id}`}
                  alt="User Avatar"
                />
              ) : (
                <img
                  src={`https://www.gravatar.com/avatar/00000000000000000000000000000000?d=identicon&f=y`}
                  alt="User Avatar"
                />
              )}
            </div>
            <div className="user_search_info">
              <h2>@{user.username}</h2>
              <p>{user.name}</p>
            </div>
            <button className="user_search_btn" id="user_add_delete_btn" onClick={!userFriends.includes(user._id, userFriends, setUserFriends) ? (e) => handleAddFriend(e, user._id) : (e) => handleDeleteFriend(e, user._id)} onMouseEnter={(e) => handleBtnHover(e, userFriends.includes(user._id))} onMouseLeave={(e) => handleBtnOut(e, userFriends.includes(user._id))} >{ userFriends.includes(user._id) ? '✔️ Friends' : 'Add Friend' } </button>
            <button className="user_search_btn" onClick={() => handleOProfileId(user._id)}>View Profile</button>
          </div>
        ))}
      </div>
    </div>
  )
}