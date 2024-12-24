import React, { useEffect, useRef, useState, useCallback } from "react";
import Icon from '@mdi/react';
import { mdiDotsVertical, mdiRefresh } from '@mdi/js';
import './Chat.css'
import { fetchSendMessage, fetchSingleChat, fetchDeleteMessageUser, fetchDeleteMessageAll, fetchDeleteChatUser, fetchDeleteChatAll, fetchSingleChatByUser } from "../helpers/apiHelper";
import { ImageModal } from "./imageModal";


const ContextMenu = ({ items = [], position, visible, onClose }) => {
  const menuRef = useRef(null);
  useEffect(() => {
    const handleclickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('click', handleclickOutside);
    return () => document.removeEventListener("click", handleclickOutside);
  }, [onClose]);

  if (!visible) return null;

  return (
    <div
      className="context-menu"
      ref={menuRef}
      style={{ top: `${position.y}px`, left: `${position.x}px` }}
    >
      {items.map((item, index) => (
        item !== null ? (
          <div key={index} className="item" onClick={item.onClick}>
            {item.label}
          </div>
        ) : null
      ))}
    </div>
  )
}

const ModalMenuDelete = ({ delete_type, message_id, visible, onModalClose, preventPropagation, chat_id, fetchData, second_user_id, setPage }) => {
  const [errors, setErrors] = useState([]);
  const [alert, setAlert] = useState([]);

  const handleDeleteMessageUser = async () => {
    try {
      const request = await fetchDeleteMessageUser(chat_id, message_id);
      if (request.success) {
        setAlert(['Message deleted successfully']);
        await fetchData();
        onModalClose();
      } else {
        setErrors(['There was an error deleting the message.']);
        onModalClose();
      }
    } catch (error) {
      setErrors('There was an error contacting the API.');
      onModalClose();
    }
  }

  const handleDeleteMessageForAll = async () => {
    try {
      const request = await fetchDeleteMessageAll(message_id);
      if (request.success) {
        setAlert(['Message deleted successfully']);
        await fetchData();
        onModalClose();
      } else {
        setErrors(['There was an error deleting the message.']);
        onModalClose();
      }
    } catch (error) {
      setErrors('There was an error contacting the API.');
      onModalClose();
    }
  }

  const handleDeleteChatUser = async () => {
    try {
      const request = await fetchDeleteChatUser(second_user_id);
      if (request.success) {
        setAlert(['Chat deteled successfully'])
      } else {
        setErrors('There was an error deleting the chat.');
      }
      onModalClose();
      setPage('home');
    } catch (error) {
      setErrors('There was an error contacting the API.');
      onModalClose();
    }
  }

  const handleDeleteChatAll = async () => {
    try {
      const request = await fetchDeleteChatAll(second_user_id);
      if (request.success) {
        setAlert(['Chat deteled successfully']);
      } else {
        setErrors('There was an error deleting the chat.');
      }
      onModalClose();
      setPage('home');
    } catch (error) {
      setErrors('There was an error contacting the API.');
      onModalClose();
    }
  }

  const handleDeleteMessage = () => {
    switch (delete_type) {
      case 'user':
        handleDeleteMessageUser();
        break;
      case 'all':
        handleDeleteMessageForAll();
        break;
      case 'chat_user':
        handleDeleteChatUser();
        break;
      case 'chat_all':
        handleDeleteChatAll();
    }
  }

  const handleDeleteType = (delete_type) => {
    let typeMessage = ''
    switch (delete_type) {
      case 'user':
        return typeMessage = 'Are you sure you want to delete this message?'
      case 'all':
        return typeMessage = 'Are you sure you want to delete this message for all?'
      case 'chat_user':
        return typeMessage = 'Are you sure you want to delete this chat?'
      case 'chat_all':
        return typeMessage = 'Are you sure you want to delete this chat for all?'
      default:
        return typeMessage = "There is no type";
    }
    return typeMessage;
  }

  if (!visible) return null;

  return (
    <div className="modal_container" onClick={() => onModalClose()}>
      <div className="modal_delete" onClick={(e) => preventPropagation(e)}>
        <div className="modal-title">Delete Message</div>
        {delete_type && <p>{handleDeleteType(delete_type)}</p>}
        <div className="modal_delete_buttons">
          {delete_type === 'user' || delete_type === 'all' ? (
            <button className="delete_message_button delete_modal_button" onClick={handleDeleteMessage}>Delete</button>
          ) : (
            <button className="delete_message_button delete_modal_button" onClick={handleDeleteMessage}>Delete</button>
          )}
          <button className="cancel_delete_message_button delete_modal_button" onClick={() => onModalClose()}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const ModalOptions = ({ visible, onModalClose, second_user_id, preventPropagation, handleOnDelete, messagesLength, handleOProfileId }) => {
  const [errors, setErrors] = useState([]);
  const [alert, setAlert] = useState([]);

  useEffect(() => {
    if (visible) {
      document.addEventListener('click', onModalClose)
    }
    return () => {
      document.removeEventListener("click", onModalClose);
    };
  }, [visible])

  if (!visible) return null;

  return (
    <div className="options_modal_container" onClick={(e) => preventPropagation(e)}>
      <div className="options_modal">
        <p onClick={() => handleOProfileId(second_user_id)}>View Profile</p>
        {messagesLength > 0 ? (
          <>
            <p onClick={(e) => handleOnDelete(e, '', second_user_id, 'chat_user')}>Delete chat</p>
            <p onClick={(e) => handleOnDelete(e, '', second_user_id, 'chat_all')}>Delete chat for all</p>
          </>
        ) : null}
      </div>
    </div>
  );
}

export const Chat = ({ user, chatId, nowDate, setPage, handleOProfileId }) => {
  const [chatInfo, setChatInfo] = useState([]);
  const [chatDBTY, setChatDBTY] = useState(false);
  const [formData, setFormData] = useState({
    text: "",
    image: [],
  })
  const [firstRenderMessageLength, setFirstRenderMessageLength] = useState(0);
  const [errors, setErrors] = useState([]);
  const messagesEndRef = useRef(null);
  const [selectedText, setSelectedText] = useState('');

  const [contextMenu, setContextMenu] = useState({
    visible: false,
    position: { x: 0, y: 0 },
    message: {},
  });

  const [deleteModal, setDeleteModal] = useState({
    delete_type: '',
    message_id: '',
    second_user_id: '',
    visible: false,
  })

  const [optionsModal, setOptionsModal] = useState({
    second_user_id: '',
    visible: false,
  })

  // Data handling

  const fetchData = async () => {
    try {
      const data = await fetchSingleChat(chatId);
      if (!data.success && data.error === "This chat don't belong to you.") {
        setChatDBTY(true);
        return;
      } else if (!data.success && data.error === 'Chat not found.') {
        const data = await fetchSingleChatByUser(chatId);
        setChatInfo(data.chat);
        setFirstRenderMessageLength(data.chat.messages.length);
      }
      if (data.success) {
        setChatInfo(data.chat);
        setFirstRenderMessageLength(data.chat.messages.length);
      } else {
        setErrors([data.error]);
      }
    } catch (error) {
      setErrors(['There was an error fetching chat']);
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
      const data = await fetchSendMessage(excludeUser(chatInfo.users)._id, formDataToSend);
      if (data.success && data.message === "Message succesfully created.") {
        setFormData({
          text: "",
          image: [],
        });
        setFirstRenderMessageLength(chatInfo.messages.length);
        await fetchData()
          .catch(err => {
            setErrors(['There was an error sending the message.']);
          });
      }
    } catch (error) {
      setErrors(['There was an error sending the message.']);
    }
  }

  const excludeUser = (users) => {
    return users.filter((u) => u._id !== user)[0];
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView();
  };

  // Contextmenu(click_derecho)

  const handleOnContextMU = (e, message) => {
    e.preventDefault();
    const selection = window.getSelection().toString();
    setSelectedText(selection);
    setContextMenu({
      visible: true,
      position: { x: e.pageX, y: e.pageY },
      message,
    });
  }

  const closeContextMU = () => {
    setContextMenu({ ...contextMenu, visible: false });
  }


  // Delete modal menu
  const handleOnDelete = (e, message_id, second_user_id, delete_type) => {
    e.preventDefault();
    setDeleteModal(
      {
        delete_type: delete_type,
        message_id: message_id,
        second_user_id: second_user_id,
        visible: true,
      }
    )
    if (delete_type === 'user' || delete_type === 'all') {
      closeContextMU();
    } else {
      handleOnOptionsClose();
    }
  }

  const handleOpenImageOnTab = (messageId) => {
    window.open(`http://localhost:3000/api/chat/message/image/${messageId}`, '_blank').focus();
    closeContextMU();
  }

  const handleCopy = (message) => {
    navigator.clipboard.writeText(selectedText !== '' ? selectedText : message.text);
    closeContextMU();
  }

  const handleOnDeleteClose = () => {
    setDeleteModal({ ...deleteModal, visible: false });
  }

  // Options modal menu
  const handleOnOptions = (e, second_user_id) => {
    e.stopPropagation();
    e.preventDefault();
    setOptionsModal(
      {
        second_user_id,
        visible: !optionsModal.visible,
      }
    )
  }

  const handleOnOptionsClose = () => {
    setOptionsModal({
      ...optionsModal, visible: false
    });
  }

  // Global preventpropagation

  const handlePreventPropagation = (e) => {
    e.stopPropagation();
  }

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

  const [openImage, setOpenImage] = useState({
    id: '',
    opened: false,
    type: '',
  });

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

  if (chatDBTY) {
    return <>
      <div className="chat-dbty-container">
        <h1>403: This chat doesn't belong to you.</h1>
      </div>
    </>
  }
  return (
    <>
      {
        openImage.opened ? (
          <ImageModal type={openImage.type} id={openImage.id} handleModalClose={handleCloseImage} />
        ) : null
      }
      <ModalMenuDelete
        delete_type={deleteModal.delete_type}
        message_id={deleteModal.message_id}
        visible={deleteModal.visible}
        onModalClose={handleOnDeleteClose}
        preventPropagation={handlePreventPropagation}
        chat_id={chatInfo._id}
        fetchData={fetchData}
        setPage={setPage}
        second_user_id={deleteModal.second_user_id}
      />
      <div className="chat-container">
        <div className="chat-top">
          <div className="chat-top-l">
            {chatInfo && chatInfo.users ? (
              chatInfo.users && excludeUser(chatInfo.users).profile.profile_picture.image_type === "" ? (
                <img
                  src={`https://www.gravatar.com/avatar/00000000000000000000000000000000?d=identicon&f=y`}
                  alt="User Avatar"
                  className="home-user-icon"
                />
              ) : (
                <img
                  src={`http://localhost:3000/api/user/profile/thumbnail/${excludeUser(chatInfo.users)._id}`}
                  alt="User Avatar"
                  className="home-user-icon"
                />
              )
            ) : null}

            {
              chatInfo && chatInfo.users ? (
                <div className="chat-top-info">
                  <h3>{chatInfo ? excludeUser(chatInfo.users).name : null}</h3>
                  <h4>@{chatInfo ? excludeUser(chatInfo.users).username : null}</h4>
                </div>
              ) : null
            }
          </div>

          <div className="chat-menu-btn-container">
            <Icon path={mdiRefresh} size={3} className="chat_menu_btn_icon" onClick={() => fetchData()} />
            <Icon path={mdiDotsVertical} size={3} className={`chat_menu_btn_icon ${optionsModal.visible ? 'chat_menu_btn_icon_selected' : null}`} onClick={(e) => handleOnOptions(e, excludeUser(chatInfo.users)._id)} />
          </div>
          <ModalOptions visible={optionsModal.visible} second_user_id={optionsModal.second_user_id} onModalClose={handleOnOptionsClose} preventPropagation={handlePreventPropagation} handleOnDelete={handleOnDelete} messagesLength={firstRenderMessageLength} handleOProfileId={handleOProfileId} />
        </div>
        <div className="chat-m-c" id="chatMC">
          {
            chatInfo && chatInfo.messages ? (
              chatInfo.messages.map((m) => (
                m.user === user ? (
                  (
                    <div key={m._id}>
                      <div className="chat-m-s-u" key={m._id} onContextMenu={(e) => handleOnContextMU(e, m)}>
                        <div className="chat-m-s-u-c">
                          {m.image && m.image.image_type !== '' ? (
                            <img src={`http://localhost:3000/api/chat/message/image/${m._id}`} alt="Image from message" style={{ cursor: "pointer" }} onClick={() => handleOpenImage('message', m._id)} />
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
                    <div className="chat-m-s-o" onContextMenu={(e) => console.log('click derecho siuuu')}>
                      <div className="chat-m-s-u-c other">
                        {m.image && m.image.image_type !== '' ? (
                          <img src={`http://localhost:3000/api/chat/message/image/${m._id}`} alt="Image from message" style={{ cursor: "pointer" }} onClick={() => handleOpenImage('message', m._id)} />
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
            ) : null
          }
          <div ref={messagesEndRef} />
        </div>

        <ContextMenu
          items={[
            Object.keys(contextMenu.message).includes('image') ? {
              label: "Open image in new tab", onClick: () => handleOpenImageOnTab(contextMenu.message.image && contextMenu.message.image.image_type !== '' ? contextMenu.message._id : '')
            } : null,
            { label: "Copy", onClick: () => handleCopy(contextMenu.message) },
            { label: "Delete for you", onClick: (e) => handleOnDelete(e, contextMenu.message._id, '', 'user') },
            { label: "Delete for all", onClick: (e) => handleOnDelete(e, contextMenu.message._id, '', 'all') },
          ]}
          position={contextMenu.position}
          visible={contextMenu.visible}
          onClose={closeContextMU}
        />


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
    </>
  )
}