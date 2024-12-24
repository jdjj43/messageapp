import { useEffect, useState } from "react";
import "./Home.css";
import { fetchFullUserInfo, fetchUserFriends, fetchChatHistory, fetchGroupsHistory } from "../helpers/apiHelper";
import { Truncate } from '@re-dev/react-truncate';
import { mdiImageOutline } from '@mdi/js';

export const Home = ({ user, nowDate, setChatId, setPage, handleOProfileId, handleFriendsPage }) => {
  const [userInfo, setUserInfo] = useState({});
  const [messageHistory, setMessageHistory] = useState({});
  const [groups, setGroups] = useState([]);
  const [chats, setChats] = useState([]);
  const [errors, setErrors] = useState([]);
  const [friendList, setFriendList] = useState([]);

  const excludeUser = (users) => {
    return users.filter((u) => u._id !== user)[0];
  }

  const handleGroupOnClick = (groupId) => {
    setChatId(groupId);
    setPage('group');
  }

  const handleChatOnClick = (chatId) => {
    setChatId(chatId);
    setPage('chat');
  }

  const [imageReloadToken, setImageReloadToken] = useState(Date.now());

  const reloadImage = () => {
    setImageReloadToken(Date.now());
  }

  useEffect(() => {
    const getUserInfo = async () => {
      await fetchFullUserInfo(user)
        .then(data => {
          setUserInfo(data.user);
        })
        .catch(error => {
          setErrors(['There was an error with the API request']);
        })
      await fetchChatHistory(7)
        .then(data => {
          if (data.success) {
            const sortedChats = data.chats.sort((a, b) => new Date(b.last_message) - new Date(a.last_message));
            setChats(sortedChats);
          } else {
            setErrors(['There was an error fetching chat history']);
          }
        })
        .catch(error => {
          setErrors(['There was an error with the API request']);
        })
      await fetchGroupsHistory(7)
        .then(data => {
          if (data.success) {
            const sortedGroups = data.groups.sort((a, b) => new Date(b.last_message) - new Date(a.last_message));
            setGroups(sortedGroups);
          } else {
            setErrors(['There was an error fetching group history']);
          }
        })
        .catch(error => {
          setErrors(['There was an error with the API request']);
        });
      await fetchUserFriends(user, 7)
        .then(data => {
          if (data.success) {
            setFriendList(data.friends);
          } else {
            setErrors(['There was an error fetching friends']);
          }
        })
        .catch(err => {
          setErrors(['There was an error fetching friends']);
        })
    }
    getUserInfo();
    reloadImage();
    const content = document.getElementById('content');
    if (content) {
      content.classList.add('container_home_height');
    }
    return () => {
      if (content) {
        content.classList.remove('container_home_height');
      }
    }
  }, [])

  return (
    <>
      <div className="home-container">
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
              />
            )}
          </div>
          <div className="data">
            <h2>Welcome, {userInfo.name}.</h2>
            <h4>@{userInfo.username}</h4>
          </div>

        </div>
        <div className="squares">
          <div className="friends-square square">
            <h3>Friends</h3>
            <div className='friends-length'>
              <p onClick={() => handleFriendsPage(user,'self')}>View all friends</p>
            </div>
            <div className='friend-list'>
              {friendList && friendList.length > 0 ? (
                friendList.slice(0, 8).map((f, i) =>
                  <div className="friend" key={`${f._id}${i}`} onClick={() => handleOProfileId(f._id)}>
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
              <p onClick={() => setPage('groups')}>View all groups</p>
            </div>
            <div className="messages-square-messages">
              {
                groups && groups.length > 0 ? (

                  groups.map(g => (
                      <div className="message-container" key={g._id} onClick={() => handleGroupOnClick(g._id)}>
                        {g.image !== undefined && g.image.image_type !== '' ? (
                          <img src={`http://localhost:3000/api/group/${g._id.toString()}/thumbnail/`} className="friend-thumbnail"></img>
                        ) : (
                          <img
                            src="https://www.gravatar.com/avatar/00000000000000000000000000000000?d=identicon&f=y"
                            alt="User Avatar"
                            className="friend-thumbnail"
                          />
                        )
                        }
                        <div>
                          <h4>{g.name}</h4>
                          {
                            g.messages.length > 0 ? (

                              <><div className="message">
                                <Truncate lines={1}>{userInfo._id === g.messages[0].user._id ? 'You: ' : `${g.messages[0].user.name.split(' ')[0]}: `}{g.messages[0].image && g.messages[0].image.imageType !== '' ? `🖼️` : null}{g.messages[0].text}</Truncate>
                              </div>
                                <p className="message-time">{new Date(g.messages[0].time_stamp).toLocaleString("es-ES", {
                                  year: "numeric",
                                  month: "numeric",
                                  day: "numeric",
                                }) === new Date(nowDate).toLocaleString("es-ES", {
                                  year: "numeric",
                                  month: "numeric",
                                  day: "numeric",
                                }) ? `${new Date(g.messages[0].time_stamp).toLocaleTimeString("es-ES", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })}` : `${new Date(g.messages[0].time_stamp).toLocaleTimeString("es-ES", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                  year: "numeric",
                                  month: "numeric",
                                  day: "numeric",
                                })}`}</p></>
                            ) : <>New Group</>
                          }
                        </div>
                      </div>
                  )
                  )
                ) :
                  (
                    <p>No messages available!</p>
                  )
              }
            </div>
          </div>
          <div className="messages-square square">
            <h3>Last messages</h3>
            <div className='friends-length'>
              <p onClick={() => setPage('messages')}>View all messages</p>
            </div>
            <div className="messages-square-messages">
              {
                chats && chats.length > 0 ? (
                  chats.map(c =>
                    <div className="message-container" key={c._id} onClick={() => handleChatOnClick(c._id)}>
                      {excludeUser(c.users).profile && excludeUser(c.users).profile.profile_picture.image_type !== '' ? (
                        <img src={`http://localhost:3000/api/user/profile/thumbnail/${excludeUser(c.users)._id}`} className="friend-thumbnail"></img>
                      ) : (
                        <img
                          src="https://www.gravatar.com/avatar/00000000000000000000000000000000?d=identicon&f=y"
                          alt="User Avatar"
                          className="friend-thumbnail"
                        />
                      )
                      }

                      <div>
                        <h4>{excludeUser(c.users).name}</h4>
                        <div className="message">
                          <Truncate lines={1}>{userInfo._id === c.messages[0].user ? 'You: ' : null}{c.messages[0].image && c.messages[0].image.imageType !== '' ? `🖼️` : null}{c.messages[0].text}</Truncate>

                        </div>
                        <p className="message-time">{new Date(c.messages[0].time_stamp).toLocaleString("es-ES", {
                          year: "numeric",
                          month: "numeric",
                          day: "numeric",
                        }) === new Date(nowDate).toLocaleString("es-ES", {
                          year: "numeric",
                          month: "numeric",
                          day: "numeric",
                        }) ? `${new Date(c.messages[0].time_stamp).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}` : `${new Date(c.messages[0].time_stamp).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                          year: "numeric",
                          month: "numeric",
                          day: "numeric",
                        })}`}</p>
                      </div>
                    </div>
                  )
                ) :
                  (
                    <p>No messages available!</p>
                  )
              }
            </div>
          </div>
        </div>

      </div>
    </>
  );
};
