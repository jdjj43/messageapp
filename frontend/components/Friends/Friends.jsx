import React, { useEffect, useState } from "react"
import "./Friends.css"
import { fetchUserFriends } from "../helpers/apiHelper"
export const Friends = ({ friendsPage, handleOProfileId }) => {
  const [friends, setFriends] = useState([]);
  const [errors, setErrors] = useState([]);

  const fetchFriends = async () => {
    try {
      const request = await fetchUserFriends(friendsPage.userId);
      if (request.success) {
        setFriends(request.friends);
      } else {
        setErrors([request.error]);
      }
    } catch (error) {
      setErrors['There was an error with the API.'];
    }
  }

  useEffect(() => {
    fetchFriends();
    const content = document.getElementById('content');
    if (content) content.classList.add('content_friends');
    return (() => content ? content.classList.remove('content_friends') : null);
  }, [])

  return (
    <div className="friends-container">
      <h1>{friendsPage.name !== 'self' ? `${friendsPage.name} > Friends` : 'Friends'}</h1>
      <div className="friends_list">
        {
          friends.map((friend) => (
            <div className="friend_single" onClick={(() => handleOProfileId(friend._id))} key={friend._id}>
              {
                friend.profile && friend.profile.profile_picture.image_type !== '' ? (
                  <img
                    src={`http://localhost:3000/api/user/profile/thumbnail/${friend._id}`}
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
              <p>{friend.name}</p>
              <p>@{friend.username}</p>
            </div>
          ))
        }
      </div>
    </div>
  )
}