import React, { useEffect, useState } from "react";
import './OUserProfile.css';
import { fetchAddFriend, fetchDeleteFriend, fetchFullUserInfo, fetchUserFriends, fetchUserIsFriend } from "../../helpers/apiHelper";
export const OUserProfile = ({ userId, setChatId, setPage, handleFriendsPage }) => {
  const [userInfo, setUserInfo] = useState({});
  const [userIsFriend, setUserIsFriend] = useState(false);
  const [userFriends, setUserFriends] = useState([]);
  const [errors, setErrors] = useState([]);
  const getUserInfo = async () => {
    try {
      const request = await fetchFullUserInfo(userId);
      if (request.success) {
        setUserInfo(request.user);
      } else {
        setErrors([...errors, request.message]);
      }
    } catch (error) {
      setErrors([...errors, 'There was an error with the API.']);
    }

    try {
      const request = await fetchUserFriends(userId, 8);
      if (request.success) {
        setUserFriends(request.friends);
      } else {
        setErrors([...errors, request.message]);
      }
    } catch (error) {
      setErrors([...errors, 'There was an error with the API.']);
    }
  };

  const checkIsFriend = async () => {
    try {
      const request = await fetchUserIsFriend(userId);
      if (request.success) {
        setUserIsFriend(true);
      } else {
        setUserIsFriend(false);
        setErrors([...errors, request.message]);
      }
    } catch (error) {
      setErrors([...errors, 'There was an error with the API.']);
    }
  }

  useEffect(() => {
    checkIsFriend();
    getUserInfo();
    const content = document.getElementById('content');
    content.classList.add('o_user_profile_content');
    return () => {
      content.classList.remove('o_user_profile_content');
    }
  }, []);

  const handleBtnHover = (e, isFriend) => {
    if (isFriend) {
      e.target.innerText = '✖️ Remove Friend';
    } else {
      e.target.innerText = 'Add Friend';
    }
  }

  const handleBtnOut = (e, isFriend) => {
    if (isFriend) {
      e.target.innerText = '✔️ Friends';
    } else {
      e.target.innerText = 'Add Friend';
    }
  }

  const handleAddFriend = async (e) => {
    try {
      const response = await fetchAddFriend(userId);
      if (response.success) {
        setUserIsFriend(true);
        e.target.innerText = '✔️ Friends';
      } else {
        setErrors([...errors, response.message]);
      }
    } catch (error) {
      setErrors([...errors, 'There was an error with the API.']);
    }
  };

  const handleDeleteFriend = async (e) => {
    try {
      const response = await fetchDeleteFriend(userId);
      if (response.success) {
        setUserIsFriend(false);
        e.target.innerText = 'Add Friend';
      } else {
        setErrors([...errors, response.message]);
      }
    } catch (error) {
      setErrors([...errors, 'There was an error with the API.']);
    }
  };

  const handleOpenMessages = async () => {
    setChatId(userId);
    setPage('chat');
  }

  return (
    <div className="ou_container">
      <div className="ou_window">
        <div className="ou_info">
          <div className="ou_avatar">
            {userInfo.profile && userInfo.profile.profile_picture.image_type !== "" ? (
              <img src={`http://localhost:3000/api/user/profile/thumbnail/${userInfo._id}`} alt="Friend Avatar" />
            ) : (
              <img
                src={`https://www.gravatar.com/avatar/00000000000000000000000000000000?d=identicon&f=y`}
                alt="Friend Avatar"
              />
            )}
          </div>
          <div className="ou_info_text">
            <div className="ou_name">
              <h1>{userInfo.name}</h1>
            </div>
            <div className="ou_username">
              <h3>{userInfo.username}</h3>
            </div>
            <div className="ou_bio">
              {userInfo.profile && userInfo.profile.description !== '' ? <p>{userInfo.profile.description}</p> : null}
            </div>
            <div className="ou_since">
              <p>Joined on: {new Date(userInfo.join_date).toLocaleString("en-US", {
                year: "numeric",
                month: "long",
              })}.</p>
            </div>
          </div>
        </div>
        <div className="ou_options">
          <button className="user_search_btn" id="user_add_delete_btn" onClick={!userIsFriend ? (e) => handleAddFriend(e) : (e) => handleDeleteFriend(e)} onMouseEnter={(e) => handleBtnHover(e, userIsFriend)} onMouseLeave={(e) => handleBtnOut(e, userIsFriend)} >{userIsFriend ? '✔️ Friends' : 'Add Friend'} </button>
          <button className="ou_options_btn" onClick={handleOpenMessages}>Message</button>
        </div>
        <div className="ou_content">
          <div className="ou_friends">
            <div className="ou_friends_title">
              <h2>Friends</h2>
              <div className="ou_friends_count">
                <p>{userInfo.friends ? userInfo.friends.length : 0} friends</p>
                {userInfo.friends && userInfo.friends.length > 0 ? (
                  <p className="see_all" onClick={() => handleFriendsPage(userId, userInfo.name)}>See all friends</p>
                ) : null
                }

              </div>
            </div>
            <div className="ou_friends_list">
              {userFriends.map((friend) => (
                <div className="friend">
                  <div className="friend_avatar">
                    {friend.profile.profile_picture && friend.profile.profile_picture.image_type !== "" ? (
                      <img src={`http://localhost:3000/api/user/profile/thumbnail/${friend._id}`} alt="Friend Avatar" />
                    ) : (
                      <img
                        src={`https://www.gravatar.com/avatar/00000000000000000000000000000000?d=identicon&f=y`}
                        alt="Friend Avatar"
                        className="home-user-icon"
                      />
                    )}
                    {/* <img src="https
                    ) : () }
                    {/* <img src="https://via.placeholder.com/50" alt="Friend Avatar" /> */}
                  </div>
                  <div className="friend_name">
                    <p>{friend.name}</p>
                    <p>@{friend.username}</p>
                  </div>
                </div>
              ))}
              {/* <div className="friend">
                <div className="friend_avatar">
                  <img src="https://via.placeholder.com/50" alt="Friend Avatar" />
                </div>
                <div className="friend_name">
                  <p>Friend Name</p>
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};