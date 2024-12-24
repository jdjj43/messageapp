import React, { useEffect, useState } from "react";
import { Truncate } from '@re-dev/react-truncate';
import './Messages.css';
import { fetchChatHistory, fetchGroupsHistory } from "../helpers/apiHelper";

export const Messages = ({ user, nowDate, setChatId, setPage }) => {
  const [allMessages, setAllMessages] = useState([]);
  const [errors, setErrors] = useState([])

  const excludeUser = (users) => {
    return users.filter((u) => u._id !== user)[0];
  }

  const handleOnClick = (id) => {
    setChatId(id);
    setPage('chat')
  };

  const handleOnClickGroup = (id) => {
    setChatId(id);
    setPage('group');
  }

  useEffect(() => {
    const handleHistories = async () => {
      let allC;
      await fetchChatHistory()
        .then(d => {
          if (d.success) {
            allC = d.chats;
          } else {
            setErrors([d.error]);
          }
        })
        .catch(e => {
          setErrors(['There was an error with the API request']);
        })
      await fetchGroupsHistory()
        .then(d => {
          if (d.success) {
            allC = [...allC.concat(d.groups)];
          } else {
            setErrors([d.error]);
          }
        })
        .catch(e => {
          setErrors(['There was an error with the API request']);
        })
      allC.sort((a, b) => new Date(b.last_message) - new Date(a.last_message));
      setAllMessages(allC);
    }
    handleHistories();
    const content = document.getElementById('content');
    if (content) {
      content.classList.add('container_messages_height');
    }
    return () => {
      if (content) {
        content.classList.remove('container_messages_height');
      }
    }
  }, []);
  return (
    <div className="messages-major-container">
      <h1>Messages</h1>
      <div className="messages-container">
        {allMessages.map((c) => (
          Object.keys(c).includes('name') ? (
            <div className="message-card" key={c._id} onClick={() => handleOnClickGroup(c._id)}>
              {c.image !== undefined && c.image.imageType !== '' ? (
                <img src={`http://localhost:3000/api/group/${c._id}/thumbnail`} alt="User Avatar" className="friend-thumbnail message-thumbnail" />
              ) : (
                <img
                  src="https://www.gravatar.com/avatar/00000000000000000000000000000000?d=identicon&f=y"
                  alt="User Avatar"
                  className="friend-thumbnail message-thumbnail"
                />
              )}
              <div className="message-card-rs">
                <h3>{c.name}</h3>
                {
                  c.messages.length > 0 ? (
                    <>
                      <p className="message-card-rs-m"><Truncate lines={1}>{c.messages[0].user._id === user ? 'You: ' : `${c.messages[0].user.name.split(' ')[0]}: `}{c.messages[0].image && c.messages[0].image.imageType !== '' ? `🖼️` : null}{c.messages[0].text}</Truncate></p>
                      <p className="message-card-rs-d">{new Date(c.messages[0].time_stamp).toLocaleString("es-ES", {
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
                    </>
                  ) : <p>New Group</p>
                }

              </div>
            </div>
          ) : (
            <div className="message-card" key={c._id} onClick={() => handleOnClick(c._id)}>
              {excludeUser(c.users).profile && excludeUser(c.users).profile.profile_picture.image_type !== '' ? (
                <img src={`http://localhost:3000/api/user/profile/avatar/${excludeUser(c.users)._id}`} alt="User Avatar" className="friend-thumbnail message-thumbnail" />
              ) : (
                <img
                  src="https://www.gravatar.com/avatar/00000000000000000000000000000000?d=identicon&f=y"
                  alt="User Avatar"
                  className="friend-thumbnail message-thumbnail"
                />
              )}
              <div className="message-card-rs">
                <h3>{excludeUser(c.users).name}</h3>
                <div style={{ maxWidth: '100%' }}>
                  <p className="message-card-rs-m">
                    <Truncate lines={1}>{c.messages[0].user === user ? 'You: ' : ''}{c.messages[0].image && c.messages[0].image.imageType !== '' ? `🖼️` : null}{c.messages[0].text}</Truncate>
                  </p>
                </div>
                <p className="message-card-rs-d">{new Date(c.messages[0].time_stamp).toLocaleString("es-ES", {
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
        ))}
      </div>
    </div>
  )
};