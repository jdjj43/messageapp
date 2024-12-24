import React, { useEffect, useRef, useState } from "react";
import Icon from '@mdi/react';
import { mdiRefresh, mdiAccountGroup, mdiShieldCrown, mdiArrowLeftCircle, mdiPencilCircle } from '@mdi/js';
import './Chat.css'
import { fetchGroupSendMessage, fetchSingleGroup } from "../helpers/apiHelper";
import { GroupOptions } from "./Group/GroupOptions";
import { ImageModal } from "./imageModal";

export const Group = ({ user, groupId, nowDate, setPage }) => {
  const [chatInfo, setChatInfo] = useState([]);
  const [formData, setFormData] = useState({
    text: "",
    image: [],
  })
  const [yANPOG, setYANPOG] = useState(false);
  const [imageReloadToken, setImageReloadToken] = useState(Date.now());
  const [errors, setErrors] = useState([]);
  const messagesEndRef = useRef(null);

  const [optionsWindow, setOptionsWindow] = useState({
    group_id: '',
    visible: false,
  });

  const [openImage, setOpenImage] = useState({
    id: '',
    opened: false,
    type: '',
  });

  const fetchData = async () => {
    try {
      const data = await fetchSingleGroup(groupId);

      if (!data.success && data.error === 'You are not part of this group.') {
        setYANPOG(true);
        setPage('home');
        return;
      }

      if (data.success) {
        setChatInfo(data.group);
      } else {
        setErrors([data.error]);
        setPage('home');
      }
    } catch (error) {
      setErrors(['There was an error fetching chat']);
      setPage('home');
    }
  }

  const handleOnChange = (e) => {
    if (e.target.name === 'image') {
      setFormData({ ...formData, [e.target.name]: e.target.files[0] });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleOnSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    formDataToSend.append("text", formData.text);
    formDataToSend.append("image", formData.image);
    try {
      const data = await fetchGroupSendMessage(chatInfo._id, formDataToSend);
      if (data.success && data.message === "Message sent succesfully") {
        setFormData({
          text: "",
          image: [],
        });
        await fetchData()
          .catch(err => {
            setErrors(['There was an error sending the message.']);
          });
      }
    } catch (error) {
      setErrors(['There was an error sending the message.']);
    }
  }

  const reloadImage = () => {
    setImageReloadToken(Date.now());
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView();
  };

  useEffect(() => {
    fetchData();
    const content = document.getElementById('content');
    if (content) {
      content.classList.add('content_chat');
    }
    return () => {
      if (content) {
        content.classList.remove("content_chat");
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatInfo]);

  if (yANPOG) {
    return (
      <div className="chat-dbty-container">
        <h1>You are not part of this group.</h1>
      </div>
    )
  }

  const handleOnMenu = async (e, group_id) => {
    e.stopPropagation();
    e.preventDefault();
    setOptionsWindow(
      {
        group_id,
        visible: !optionsWindow.visible,
      }
    );
    if (optionsWindow.visible) {
      setTimeout(() => {
        scrollToBottom();
      }, 10);
    }
  }

  useEffect(() => {
    reloadImage();
  }, [optionsWindow.visible])

  const handleOnRefresh = (e) => {
    e.preventDefault();
    e.stopPropagation();

    fetchData();
  }

  const handleOpenImage = (type, id) => {
    setOpenImage({
      opened: true,
      type: type,
      id: id
    })
  }

  const handleCloseImage = () => {
    setOpenImage({
      opened: false,
      type: '',
      id: '',
    })
  }

  return (
    <>
      {openImage.opened ? (
        <ImageModal type={openImage.type} id={openImage.id} handleModalClose={handleCloseImage}/>
      ) : null}
      <div className="chat-big-container">
        {!optionsWindow.visible ? (
          <div className="chat-container">
            <div className="chat-top group-top-hover" onClick={(e) => handleOnMenu(e)}>
              <div className="chat-top-l">
                {chatInfo && chatInfo.name ? (
                  chatInfo.image !== undefined && Object.keys(chatInfo.image).length > 0 ? (
                    <img
                      src={`http://localhost:3000/api/group/${chatInfo._id}/thumbnail?timestamp=${imageReloadToken}`}
                      alt="Group Avatar"
                      className="home-user-icon"
                    />
                  ) : (
                    <img
                      src={`https://www.gravatar.com/avatar/00000000000000000000000000000000?d=identicon&f=y`}
                      alt="No Avatar"
                      className="home-user-icon"
                    />
                  )
                ) : null}
                {
                  chatInfo && chatInfo.users ? (
                    <div className="chat-top-info">
                      <h3>{chatInfo.name}</h3>
                    </div>
                  ) : null
                }
              </div>

              <div className="chat-menu-btn-container">
                <Icon path={mdiRefresh} size={3} className="chat_menu_btn_icon" onClick={(e) => handleOnRefresh(e)} />
              </div>

            </div>
            <div className="chat-m-c" id="chatMC">
              {
                chatInfo && chatInfo.messages !== undefined ? (
                  chatInfo.messages.map((m) => (
                    m.user._id === user ? (
                      (
                        <div key={m._id}>
                          <div className="chat-m-s-u" onContextMenu={(e) => null}>
                            <div className="chat-m-s-u-c">
                              {m.image && m.image.image_type !== '' ? (
                                <img src={`http://localhost:3000/api/chat/message/image/${m._id}`} alt="Image from message" onClick={() => handleOpenImage('message', m._id)} style={{cursor: "pointer"}} />
                              ) : null}
                              <p>{m.text !== '' ? m.text : '(Empty message)'}</p>
                            </div>
                          </div>
                          <p className="chat-m-s-u-d">{new Date(m.time_stamp).toLocaleString("es-ES", {
                            year: "numeric",
                            month: "numeric",
                            day: "numeric",
                          }) === new Date(nowDate).toLocaleString("es-ES", {
                            year: "numeric",
                            month: "numeric",
                            day: "numeric",
                          }) ? `${new Date(m.time_stamp).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}` : `${new Date(m.time_stamp).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                            year: "numeric",
                            month: "numeric",
                            day: "numeric",
                          })}`}</p>
                        </div>
                      )
                    ) : (
                      <div key={m._id}>
                        <div className="chat-m-s-o" key={m._id} onContextMenu={(e) => null}>
                          <div className="chat-m-s-u-c other">
                            <p className="chat-g-o-name">{m.user.name}</p>
                            {m.image && m.image.image_type !== '' ? (
                              <img src={`http://localhost:3000/api/chat/message/image/${m._id}`} alt="Image from message" onClick={() => handleOpenImage('message', m._id)} style={{cursor: "pointer"}} />
                            ) : null}
                            <p>{m.text !== '' ? m.text : '(Empty message)'}</p>
                          </div>
                        </div>
                        <p className="chat-m-s-o-d">{new Date(m.time_stamp).toLocaleString("es-ES", {
                          year: "numeric",
                          month: "numeric",
                          day: "numeric",
                        }) === new Date(nowDate).toLocaleString("es-ES", {
                          year: "numeric",
                          month: "numeric",
                          day: "numeric",
                        }) ? `${new Date(m.time_stamp).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}` : `${new Date(m.time_stamp).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                          year: "numeric",
                          month: "numeric",
                          day: "numeric",
                        })}`}</p>
                      </div>
                    )
                  ))
                ) : <></>
              }
              <div ref={messagesEndRef} />
            </div>
            <div className="chat-bot">
              <form onSubmit={(e) => handleOnSubmit(e)} method="POST" >
                <div className="cb-image-txt">
                  <input type="file" name="image" accept="image/*" id="image" onChange={(e) => handleOnChange(e)} />
                  <input type="text" placeholder="Send Message" name="text" required value={formData.text} onChange={(e) => handleOnChange(e)} autoComplete="off" />
                </div>
                <button type="submit">➤</button>
              </form>
            </div>
          </div>
        ) : (
          < GroupOptions chat={chatInfo} reloadChat={fetchData} handleOnMenu={handleOnMenu} user={user} groupInfo={chatInfo} setGroupInfo={setChatInfo} handleOpenImage={handleOpenImage} handleCloseImage={handleCloseImage} setPage={setPage} />
        )}
      </div>
    </>
  )
}