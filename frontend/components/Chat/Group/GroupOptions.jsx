import Icon from '@mdi/react';
import { mdiAccountGroup, mdiShieldCrown, mdiArrowLeftCircle, mdiPencilCircle, mdiAccountPlus, mdiAccountRemove, mdiCrown } from '@mdi/js';
import { useEffect, useState } from 'react';
import { fetchChangeGroupInfo, fetchRemoveMemberGroup, fetchAddMemberGroup, fetchAddAdminGroup, fetchRemoveAdminGroup, fetchLeaveGroup } from '../../helpers/apiHelper';

const ModalMember = ({ confirmationModal, handleCloseModal, setChatInfo, chatInfo, setErrors, setPage }) => {
  const [modalMessage, setModalMessage] = useState('');
  const [uname, setUname] = useState('');
  const handleRemoveMember = async () => {
    try {
      const request = await fetchRemoveMemberGroup(confirmationModal.groupId, confirmationModal.username);
      if (request.success) {
        const usersFiltered = chatInfo.usersInfo.filter((u) => u.username !== confirmationModal.username);
        setChatInfo({
          ...chatInfo, ['usersInfo']: usersFiltered,
        })
      } else {
        setErrors([request.error]);
      }
      handleCloseModal();
    } catch (error) {
      setModalMessage('There was an error with the API.');
    }
  }

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      const request = await fetchAddMemberGroup(confirmationModal.groupId, uname);
      if (request.success) {
        const newUsersInfo = [...chatInfo.usersInfo, request.user]
        setChatInfo({
          ...chatInfo, ['users']: request.user._id,
          ['usersInfo']: newUsersInfo,
        })
        handleCloseModal();
        setModalMessage('');
        return;
      } else {
        setModalMessage(request.errors[0].msg);
      }
    } catch (error) {
      setModalMessage('There was an error with the API.')
    }
  };

  const handleAddOrRemoveAdminHtml = (option) => {
    return (
      <div className='group_options_modal_window' onClick={(e) => e.stopPropagation()}>
        <h3>{option === 'add' ? "Are you sure you want to give this user admin rights?" : "Are you sure you want to remove admin rights from user?"}</h3>
        <div className='group_options_modal_window_buttons'>
          <button className='delete_modal_button delete_message_button' onClick={option === 'add' ? handleAddAdmin : handleRemoveAdmin}>{option === 'add' ? 'Confirm' : 'Remove'}</button>
          <button className='delete_modal_button' onClick={handleCloseModal}>Cancel</button>
        </div>
      </div>
    )
  }

  const handleAddAdmin = async () => {
    try {
      const request = await fetchAddAdminGroup(confirmationModal.groupId, confirmationModal.username);
      if (request.success) {
        const adminListModified = [...chatInfo.admins, confirmationModal.username];
        setChatInfo({
          ...chatInfo, admins: adminListModified
        })
        handleCloseModal();
      } else {
        setModalMessage(request.error);
      }
    } catch (error) {
      setModalMessage('There was an error with the API.');
    }
  }

  const handleRemoveAdmin = async () => {
    try {
      const request = await fetchRemoveAdminGroup(confirmationModal.groupId, confirmationModal.username);
      if (request.success) {
        const adminListModified = [...chatInfo.admins].filter((u) => u !== confirmationModal.username);
        setChatInfo({
          ...chatInfo, admins: adminListModified
        })
        handleCloseModal();
      } else {
        setModalMessage(request.error);
      }
    } catch (error) {
      setModalMessage('There was an error with the API.');
    }
  }

  const handleLeaveGroup = async () => {
    try {
      const request = await fetchLeaveGroup(confirmationModal.groupId);
      if(request.success) {
        handleCloseModal();
        setPage('home');
      } else {
        setModalMessage(request.error);
      }
    } catch (error) {
      setModalMessage('There was an error with the API.');
    }
  }

  return (
    <div className='group_options_modal' onClick={handleCloseModal}>
      {confirmationModal.type === 'leave_group' ? (
        <div className='group_options_modal_window' onClick={(e) => e.stopPropagation()}>
          <h3>Are you sure you wanna remove this member?</h3>
          <p>You can add this user again later.</p>
          <div className='group_options_modal_window_buttons'>
            <button className='delete_modal_button delete_message_button' onClick={handleLeaveGroup}>Remove</button>
            <button className='delete_modal_button' onClick={handleCloseModal}>Cancel</button>
          </div>
        </div>
      ) : null}
      {confirmationModal.type === 'delete_confirmation' ? (
        <div className='group_options_modal_window' onClick={(e) => e.stopPropagation()}>
          <h3>Are you sure you wanna remove this member?</h3>
          <p>You can add this user again later.</p>
          <div className='group_options_modal_window_buttons'>
            <button className='delete_modal_button delete_message_button' onClick={handleRemoveMember}>Remove</button>
            <button className='delete_modal_button' onClick={handleCloseModal}>Cancel</button>
          </div>
        </div>
      ) : null}
      {confirmationModal.type === 'add_member' ? (
        <div className="group_options_modal_window" onClick={(e) => e.stopPropagation()}>
          <h3>Add new member to the group</h3>

          <form className='add_member_form' onSubmit={(e) => handleAddMember(e)}>
            <div className="input-container add_member_input_container">
              <label htmlFor="username">Username</label>
              <input type="text" name="username" id="username" value={uname} onChange={(e) => setUname(e.target.value)} required />
            </div>
            <div className="group_options_modal_window_buttons">
              <button className='delete_modal_button' type='submit' >Confirm</button>
              <button className='delete_modal_button delete_message_button' onClick={handleCloseModal}>Cancel</button>
            </div>
          </form>
        </div>
      ) : null}
      {confirmationModal.type === 'admin_remove' ? (
        handleAddOrRemoveAdminHtml('remove')
      ) : null}
      {confirmationModal.type === 'admin_add' ? (
        handleAddOrRemoveAdminHtml('add')
      ) : null}
      <div className={`${modalMessage === '' ? 'invisible' : null} modal_message`} onClick={modalMessage === '' ? null : ((e) => e.stopPropagation())}>
        <p>! {modalMessage}</p>
      </div>
    </div>
  )
}

export const GroupOptions = ({ groupInfo, setGroupInfo, handleOnMenu, user, handleOpenImage, setPage }) => {
  const mockFriends = [{ name: "Alberto", username: "Perrín" }, { name: "Alberto", username: "Perrín" }, { name: "Alberto", username: "Perrín" }, { name: "Alberto", username: "Perrín" }, { name: "Alberto", username: "Perrín" }, { name: "Alberto", username: "Perrín" }, { name: "Alberto", username: "Perrín" }, { name: "Alberto", username: "Perrín" }]
  const [windowFlow, setWindowsFlow] = useState({
    users: false,
    admin_menu: false,
    group_info: false,
  });
  const [formData, setFormData] = useState({
    name: groupInfo.name,
    description: groupInfo.description,
    image: []
  });
  const [errors, setErrors] = useState([]);
  const [confirmationModal, setConfirmationModal] = useState({
    visible: false,
    groupId: groupInfo._id,
    username: '',
    type: '',
  });

  const [imageReloadToken, setImageReloadToken] = useState(Date.now());

  const reloadImage = () => {
    setImageReloadToken(Date.now());
  }

  const handleOpenMenus = (menu_name) => {
    switch (menu_name) {
      case 'users':
        setWindowsFlow({
          users: !windowFlow.users,
          admin_menu: false,
          group_info: false,
        })
        break;
      case 'admin_menu':
        setWindowsFlow({
          users: false,
          admin_menu: !windowFlow.admin_menu,
          group_info: false,
        })
        break;
      case 'group_info':
        setWindowsFlow({
          users: false,
          admin_menu: false,
          group_info: !windowFlow.group_info,
        })
        break;
    }
  }

  const handleFormData = (e) => {
    if (e.target.name === 'image') {
      if (e.target.value.length !== 0) {
        setFormData({ ...formData, 'image': [] });
      }
      setFormData({ ...formData, [e.target.name]: e.target.files[0] });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  }

  const handleOnSubmit = async (e) => {
    e.preventDefault();

    if (
      formData.name === groupInfo.name &&
      formData.description === groupInfo.description &&
      formData.image?.length === 0
    ) {
      handleOpenMenus('group_info');
      return;
    }

    try {
      const newBody = new FormData();

      newBody.append('name', formData.name);
      newBody.append('description', formData.description);
      newBody.append('image', formData.image);

      const data = await fetchChangeGroupInfo(groupInfo._id, newBody);
      if (data.success) {
        setGroupInfo({
          ...groupInfo, ['name']: formData.name,
          ['description']: formData.description
        })
        reloadImage();
        handleOpenMenus('group_info');
      } else {
        setErrors([data.error]);
      }
    } catch (error) {
      console.error('Error al enviar datos:', error);
    }
  };

  const handleOpenConfirmationModal = (e, username, type = 'delete_confirmation') => {
    e.stopPropagation();
    setConfirmationModal({
      ...confirmationModal,
      ['username']: username,
      ['visible']: true,
      ['type']: type
    })
  }

  const handleCloseConfirmationModal = () => {
    setConfirmationModal({
      ...confirmationModal,
      ['username']: '',
      ['visible']: false,
      ['type']: ''
    });
  }

  const handleOpenAddMemberModal = (e) => {
    e.stopPropagation();
    setConfirmationModal({
      ...confirmationModal,
      ['username']: '',
      ['visible']: true,
      ['type']: 'add_member'
    });
  }


  return (
    <>
      {confirmationModal.visible ? (
        <ModalMember confirmationModal={confirmationModal} handleCloseModal={handleCloseConfirmationModal} setChatInfo={setGroupInfo} chatInfo={groupInfo} setErrors={setErrors} setPage={setPage} />
      ) : null}
      <div className="group_menu_container">
        <div className="group-menu">
          <div className="group_go_back">
            <div className="group_go_back_button" onClick={(e) => handleOnMenu(e)}>
              <Icon path={mdiArrowLeftCircle} size={2} />
              <p>Go back</p>
            </div>
          </div>
          <div className="group_menu_profile">
            {
              groupInfo.image !== undefined && Object.keys(groupInfo.image).length > 0 ? (
                <img
                  src={`http://localhost:3000/api/group/${groupInfo._id}/thumbnail?reload=${imageReloadToken}`}
                  alt="Group Avatar"
                  className="home-user-icon"
                  onClick={() => handleOpenImage('group', groupInfo._id)}
                  style={{ cursor: 'pointer' }}
                />
              ) : (
                <img
                  src={`https://www.gravatar.com/avatar/00000000000000000000000000000000?d=identicon&f=y`}
                  alt="No Avatar"
                  className="home-user-icon"
                />
              )
            }
            <div className="group_menu_profile_info">
              <h3>{groupInfo.name !== '' ? groupInfo.name : null}</h3>
              <p>{groupInfo.description}</p>
            </div>
          </div>
          <div className="group_options_container">
            <div className="group_options">
              {groupInfo.admins.includes(user) ? <>
                <div className="group_option" onClick={() => handleOpenMenus('group_info')}>
                  <div className='option_name'><Icon path={mdiPencilCircle} size={1.5} />Edit group info</div>
                  {windowFlow.group_info ? (
                    <div className="edit_group_info" onClick={(e) => e.stopPropagation()}>
                      <form className="group_info_form" onClick={(e) => handleOnSubmit(e)}>
                        <input type="text" name="name" id="name" value={formData.name} onChange={(e) => handleFormData(e)} onClick={(e) => e.stopPropagation()} className='group_info_form_name' />
                        <textarea name="description" id="description" defaultValue={formData.description} onChange={(e) => handleFormData(e)} onClick={(e) => e.stopPropagation()} className='group_info_form_description' rows={5}></textarea>
                        <div>
                          <input type="file" name="image" accept="image/*" id="image" onChange={(e) => handleFormData(e)} onClick={(e) => e.stopPropagation()} />
                        </div>
                        <button type="submit" className='group_info_form_submit'>Submit</button>
                      </form>
                    </div>
                  ) : null}
                </div>
              </> : null}
              <div className="group_option" onClick={() => handleOpenMenus('users')}>
                <div className="option_name"><Icon path={mdiAccountGroup} size={1.5} />Group members list</div>
                {windowFlow.users ? (
                  <>
                    <div className="group_members">
                      {groupInfo.usersInfo.map((u) => (
                        <div className="group_member" onClick={(e) => e.stopPropagation()} key={u._id}>
                          {u.profile.profile_picture.image_type !== '' ? (
                            <img
                              src={`http://localhost:3000/api/user/profile/thumbnail/${u._id}`}
                              alt="User Avatar"
                              className="group_memberlist_membertn"
                            />
                          ) : (
                            <img
                              src={`https://www.gravatar.com/avatar/00000000000000000000000000000000?d=identicon&f=y`}
                              alt="No Avatar"
                              className="group_memberlist_membertn"
                            />
                          )}
                          <p className='group_member_name'>{user !== u._id ? u.name : 'You'}</p>
                          {groupInfo.admins.includes(u._id) && <p className='group_member_isadmin'>admin</p>}
                          {
                            groupInfo.admins.includes(user) && (
                              groupInfo.admins.includes(u._id) ? null : (
                                <p className='group_remove_button' onClick={(e) => handleOpenConfirmationModal(e, u.username)}><Icon path={mdiAccountRemove} size={1.3} /></p>
                              )
                            )
                          }
                          {groupInfo.owner.includes(user) && (
                            groupInfo.owner !== u._id ? (
                              <p className={`${groupInfo.admins.includes(u._id) ? 'group_remove_button' : 'group_admin_add'}`} onClick={(e) => handleOpenConfirmationModal(e, u._id, groupInfo.admins.includes(u._id) ? 'admin_remove' : 'admin_add')}><Icon path={mdiCrown} size={1.3} /></p>
                            ) : null
                          )}
                        </div>
                      ))}
                    </div>
                    {
                      groupInfo.admins.includes(user) && (
                        <p className='group_member_add' onClick={(e) => handleOpenAddMemberModal(e)}><Icon path={mdiAccountPlus} size={1.5} />Add new member</p>
                      )
                    }
                  </>
                ) : null}

              </div>
            </div>
          </div>
          <div className="group_leave_button">
            <button className="group_leave button" onClick={(e) => handleOpenConfirmationModal(e, '', 'leave_group')}>Leave Group</button>
          </div>
        </div>
      </div>
    </>
  )
}