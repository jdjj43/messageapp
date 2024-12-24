import { useEffect, useState } from 'react';
import './Profile.css';
import '../Home/Home.css';
import { fetchEditProfile, fetchFullUserInfo, fetchMessageHistory, fetchUserFriends } from '../helpers/apiHelper';
import { BigPicture } from './BigPicture';

const EditProfileModal = ({userData, setEditProfile, fetchUserInfo}) => {
  const [errors, setErrors] = useState([]);
  const [formData, setFormData] = useState({
    name: userData.name,
    username: userData.username,
    description: userData.profile.description,
    profile_picture: [],
  });

  const handleFormChange = (e) => {
    if (e.target.name === 'profile_picture') {
      setFormData({ ...formData, ['profile_picture']: e.target.files[0] });
    } else {      
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    }
  }

  const handleOnSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', formData.name);
    form.append('username', formData.username);
    form.append('description', formData.description);
    form.append('profile_picture', formData.profile_picture);

    try {
      const request = await fetchEditProfile(form);
      if (request.success) {
        setEditProfile(false);
        await fetchUserInfo();
      } else {
        setErrors([request.error]);
      }
    } catch (error) {
      setErrors(['There was an error with the API request.']);
    }
  }

  return (
    <div className="edit-profile-modal" onClick={() => setEditProfile(false)}>
      <div className="edit-profile-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Edit Profile</h2>
        <form onSubmit={(e) => handleOnSubmit(e)} method='POST'>
          <label htmlFor="name">Name:</label>
          <input type="text" id="name" name="name" value={formData.name} onChange={(e) => handleFormChange(e)}/>
          <label htmlFor="username">Username:</label>
          <input type="text" id="username" name="username" value={formData.username} onChange={(e) => handleFormChange(e)}/>
          <input type="file" name="profile_picture" accept="image/*" id="profile_picture" onChange={(e) => handleFormChange(e)} />
          <label htmlFor="description">Description:</label>
          <textarea id="description" name="description" value={formData.description} onChange={(e) => handleFormChange(e)}/>
          <button type="submit">Save</button>
        </form>
      </div>
    </div>
  )
}

export const Profile = ({ user, userProfile, handleProfileId, nowDate, setChatId, setPage, handleFriendsPage, reloadImageNav }) => {
  const [userInfo, setUserInfo] = useState({});
  const [openProfilePicture, setOpenProfilePicture] = useState(false);
  const [messageHistory, setMessageHistory] = useState({});
  const [friendList, setFriendList] = useState([]);
  const [errors, setErrors] = useState([]);

  const [editProfile, setEditProfile] = useState(false);

  const [imageReloadToken, setImageReloadToken] = useState(Date.now());

  const reloadImage = () => {
    setImageReloadToken(Date.now());
  }

  const fetchUserInfo = async() => {
    try {      
      const request = await fetchFullUserInfo(userProfile);
      if(request.success) {
        setUserInfo(request.user);
      } else {
        setErrors(['There was an error fetching the user.']);
      }
    } catch (error) {
      setErrors(['There was an error with the API request.']);
    }
  }

  useEffect(() => {
    const getUserInfo = async () => {
      await fetchFullUserInfo(userProfile)
        .then(data => {
          if (data.success) {
            setUserInfo(data.user);
          } else {
            setErrors(['There was an error fetching the user.']);
          }
        })
        .catch(error => {
          setErrors(['There was an error with the API request.']);
        })
      await fetchMessageHistory()
        .then(data => {
          if (data.success) {
            setMessageHistory(data.userMessageHistory);
          } else {
            setErrors(['There was an error fetching message history.']);
          }
        })
        .catch(error => {
          setErrors(['There was an error with the API request.']);
        })
      await fetchUserFriends(userProfile, 8)
        .then(data => {
          if (data.success) {
            setFriendList(data.friends);
          } else {
            setErrors(['There was an error fetching friends.']);
          }
        })
        .catch(err => {
          setErrors(['There was an error fetching friends.']);
        })
    }
    getUserInfo();
    const content = document.getElementById('content');
    if (content) {
      content.classList.add('container_profile_height');
    }
    return () => {
      if (content) {
        content.classList.remove('container_profile_height');
      }
    }
  }, [])
  
  useEffect(() => {
    reloadImage();
    reloadImageNav();
  }, [editProfile])

  const handleGroupOnClick = (groupId) => {
    setChatId(groupId);
    setPage('group');
  }

  return (
    <>
      {openProfilePicture ? (
        <BigPicture user={userProfile} setOpenProfilePicture={setOpenProfilePicture} />
      )
        : null}
      {editProfile ? (
        <EditProfileModal userData={userInfo} setEditProfile={setEditProfile} fetchUserInfo={fetchUserInfo} />
      ) : null}
      <div className="profile-container">

        <div className="profile-bar">
          <div className="profile-img">
            {userInfo.profile && userInfo.profile.profile_picture.image_type === "" ? (
              <img
                src={`https://www.gravatar.com/avatar/00000000000000000000000000000000?d=identicon&f=y`}
                alt="User Avatar"
                className="home-user-icon"
              />
            ) : (
              <img
                src={`http://localhost:3000/api/user/profile/thumbnail/${user}?timestamp=${imageReloadToken}`}
                alt="User Avatar"
                className="home-user-icon"
                onClick={() => setOpenProfilePicture(true)}
                style={{cursor: "pointer"}}
              />
            )}
          </div>
          <div className="data">
            <h2>{userInfo.name}</h2>
            <h4>@{userInfo.username}</h4>
            <h5>{userInfo.profile && userInfo.profile.description ? `${userInfo.profile.description}` : ''}</h5>
            <h5>Joined on: {new Date(userInfo.join_date).toLocaleString("es-ES", {
              year: "numeric",
              month: "numeric",
              day: "numeric",
            }) === new Date(nowDate).toLocaleString("es-ES", {
              year: "numeric",
              month: "numeric",
              day: "numeric",
            }) ? `${new Date(userInfo.join_date).toLocaleString("en-US", {
              month: "long",
              day: "numeric",
            })}` : `${new Date(userInfo.join_date).toLocaleString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}`}.</h5>
          </div>

        </div>
        <div className="squares profile-squares">
          <div className="friends-square square">
            <h3>Friends</h3>
            <div className='friends-length'>
              <p>{userInfo && userInfo.friends ? userInfo.friends.length : null} Friends</p>
              <p onClick={() => handleFriendsPage(user, 'self') }>View all friends</p>
            </div>
            <div className='friend-list'>
              {friendList && friendList.length > 0 ? (
                friendList.slice(0, 8).map((f, i) =>
                  // <li key={i}>
                  //   {f.name}
                  // </li>
                  <div className="friend" key={`${f._id}${i}`} onClick={() => handleProfileId(f._id)}>
                    {
                      f.profile && f.profile.profile_picture.image_type != "" ? (
                        <img
                          src={`http://localhost:3000/api/user/profile/thumbnail/${f._id}`}
                          alt="User Avatar"
                          className="friend-thumbnail"
                        />
                      ) : (
                        <img
                          src="https://www.gravatar.com/avatar/00000000000000000000000000000000?d=identicon&f=y"
                          alt="User Avatar"
                          className="friend-thumbnail"
                        />
                      )
                    }
                    <div className='friend-user-info'>
                      <h4>{f.name}</h4>
                      <h5>@{f.username}</h5>
                    </div>
                  </div>

                )
              ) : (
                <p>No friends available!</p>
              )}
            </div>
          </div>
          <div className="groups-square square">
            <h3>Groups</h3>
            <div className='friends-length'>
              <p>{messageHistory && messageHistory.groups ? messageHistory.groups.length : null} {messageHistory && messageHistory.groups && messageHistory.groups.length > 1 ? 'Groups' : 'Group'}</p>
              <p onClick={() => setPage('groups')}>View all groups</p>
            </div>
            <div className='friend-list '>
              {messageHistory.groups && messageHistory.groups.length > 0 ? (
                messageHistory.groups.map((g, i) =>
                (
                  <div className='friend group' key={g._id} onClick={() => handleGroupOnClick(g._id)}>
                    {
                      g.image && g.image.image_type != "" ? (
                        <img
                          src={`http://localhost:3000/api/group/${g._id}/thumbnail`}
                          alt="User Avatar"
                          className="friend-thumbnail"
                        />
                      ) : (
                        <img
                          src="https://www.gravatar.com/avatar/00000000000000000000000000000000?d=identicon&f=y"
                          alt="User Avatar"
                          className="friend-thumbnail"
                        />
                      )
                    }
                    <div className='friend-user-info'>
                      <h4>{g.name}</h4>
                    </div>
                  </div>
                )
                )) : (
                <p>No groups available!</p>
              )}
            </div>
          </div>
          <div className="options-square square">
            <h3>Options</h3>
            <button onClick={() => setEditProfile(true)}>Edit Profile</button>
          </div>
        </div>
      </div>
    </>
  )
}