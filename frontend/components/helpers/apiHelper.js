const headersAuth = {
  "Content-Type": "application/json",
  Authorization: localStorage.getItem("token"),
};

export const fetchLogin = async (form) => {
  const response = await fetch("http://localhost:3000/api/user/login/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(form),
  });
  const data = await response.json();
  if (data.success) {
    localStorage.setItem("token", `Bearer ${data.token}`);
  }
  return data;
};

export const fetchSession = async () => {
  const response = await fetch("http://localhost:3000/api/user/session", {
    headers: {
      Authorization: localStorage.getItem("token"),
    },
  });
  const data = await response.json();
  return data;
};

export const fetchRegister = async (form) => {
  const response = await fetch("http://localhost:3000/api/user/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(form),
  });
  const data = await response.json();
  return data;
};

export const fetchFullUserInfo = async (userId) => {
  const response = await fetch(`http://localhost:3000/api/user/get/${userId}`);
  const data = await response.json();
  return data;
};

export const fetchMessageHistory = async () => {
  const response = await fetch(
    `http://localhost:3000/api/user/message_history`,
    {
      headers: {
        Authorization: localStorage.getItem("token"),
      },
    }
  );
  const data = await response.json();
  return data;
};

export const fetchChatHistory = async (limit=0) => {
  const response = await fetch(`http://localhost:3000/api/chats/all?limit=${limit}`, {
    headers: {
      Authorization: localStorage.getItem("token"),
    },
  });
  const data = await response.json();
  return data;
};

export const fetchGroupsHistory = async (limit=999) => {
  const response = await fetch(`http://localhost:3000/api/group/all?limit=${limit}`, {
    headers: {
      Authorization: localStorage.getItem("token"),
    },
  });
  const data = await response.json();
  return data;
};

export const fetchUserIsFriend = async (friendId) => {
  const response = await fetch(`http://localhost:3000/api/user/friends/${friendId}/isfriend`, {
    headers: {
      Authorization: localStorage.getItem("token"),
    },
  });
  const data = await response.json();
  return data;
};

export const fetchUserFriends = async (userId, limit=null) => {
  const response = await fetch(
    `http://localhost:3000/api/user/${userId}/friends/?limit=${limit}`,
    {
      headers: {
        Authorization: localStorage.getItem("token"),
      },
    }
  );
  const data = await response.json();
  return data;
};

export const fetchUserFriendsIds = async (userId) => {
  const response = await fetch(
    `http://localhost:3000/api/user/${userId}/friends_ids/`,
    {
      headers: {
        Authorization: localStorage.getItem("token"),
      },
    }
  );
  const data = await response.json();
  return data;
};

export const fetchSingleChat = async (chatId) => {
  const response = await fetch(`http://localhost:3000/api/chat/get/${chatId}`, {
    headers: {
      Authorization: localStorage.getItem("token"),
    },
  });
  const data = await response.json();
  return data;
};

export const fetchSingleChatByUser = async (userId) => {
  const response = await fetch(`http://localhost:3000/api/chat/user/${userId}`, {
    headers: {
      Authorization: localStorage.getItem("token"),
    },
  });
  const data = await response.json();
  return data;
};

export const fetchSendMessage = async (userId, body) => {
  const response = await fetch(
    `http://localhost:3000/api/chat/message/send/${userId}`,
    {
      method: "POST",
      body: body,
      headers: {
        Authorization: localStorage.getItem("token"),
      },
    }
  );
  const data = await response.json();
  return data;
};

export const fetchCreateGroup = async(body) => {
  const response = await fetch(`http://localhost:3000/api/group/create/`, {
    method: "POST",
    body: body,
    headers: {
      Authorization: localStorage.getItem("token"),
    },
  });
  const data = await response.json();
  return data;
}

export const fetchSingleGroup = async (groupId) => {
  const response = await fetch(`http://localhost:3000/api/group/${groupId}/get`, {
    headers: {
      Authorization: localStorage.getItem("token"),
    },
  });
  const data = response.json();
  return data;
};

export const fetchGroupSendMessage = async (groupId, body) => {
  const response = await fetch(`http://localhost:3000/api/group/${groupId}/message/add/`, {
    method: "POST",
    body: body,
    headers: {
      Authorization: localStorage.getItem('token'),
    }
  });
  const data = await response.json();
  return data;
};

export const fetchDeleteMessageUser = async (chatId, messageId) => {
  const response = await fetch(`http://localhost:3000/api/chat/${chatId}/message/delete_for_user/${messageId}`, {
    method: "DELETE",
    headers: {
      Authorization: localStorage.getItem('token'),
    }
  });
  const data = await response.json();
  return data;
}

export const fetchDeleteMessageAll = async (messageId) => {
  const response = await fetch(`http://localhost:3000/api/chat/message/delete_for_all/${messageId}`, {
    method: "DELETE",
    headers: {
      Authorization: localStorage.getItem('token'),
    }
  });
  const data = await response.json();
  return data;
}

export const fetchDeleteChatUser = async (second_user_id) => {
  const response = await fetch(`http://localhost:3000/api/chat/delete_for_user/${second_user_id}`, {
    method: "DELETE",
    headers: {
      Authorization: localStorage.getItem('token'),
    }
  });
  const data = await response.json();
  return data;
}

export const fetchDeleteChatAll = async (second_user_id) => {
  const response = await fetch(`http://localhost:3000/api/chat/delete_for_all/${second_user_id}`, {
    method: "DELETE",
    headers: {
      Authorization: localStorage.getItem('token'),
    }
  });
  const data = await response.json();
  return data;
}

export const fetchChangeGroupInfo = async(groupId, body) => {
  const response = await fetch(`http://localhost:3000/api/group/${groupId}/edit/`, {
    method: "PUT",
    body: body,
    headers: {
      Authorization: localStorage.getItem('token'),
    }
  });
  const data = await response.json();

  return data;
}

export const fetchAddMemberGroup = async(groupId, username) => {
  const response = await fetch(`http://localhost:3000/api/group/${groupId}/member/add`, {
    method: "PUT",
    body: JSON.stringify({ username: username }),
    headers: {
      "Content-Type": "application/json",
      Authorization: localStorage.getItem('token'),
    }
  });
  const data = await response.json();
  return data;
}

export const fetchRemoveMemberGroup = async(groupId, username) => {
  const response = await fetch(`http://localhost:3000/api/group/${groupId}/member/remove`, {
    method: "PUT",
    body: JSON.stringify({ username: username }),
    headers: {
      "Content-Type": "application/json",
      Authorization: localStorage.getItem('token'),
    }
  });
  const data = await response.json();
  return data;
}

export const fetchAddAdminGroup = async(groupId, userId) => {
  const response = await fetch(`http://localhost:3000/api/group/${groupId}/admin/add/${userId}`, {
    method: "PUT",
    headers: {
      Authorization: localStorage.getItem('token'),
    }
  })
  const data = await response.json();
  return data;
}

export const fetchRemoveAdminGroup = async(groupId, userId) => {
  const response = await fetch(`http://localhost:3000/api/group/${groupId}/admin/remove/${userId}`, {
    method: "PUT",
    headers: {
      Authorization: localStorage.getItem('token'),
    }
  })
  const data = await response.json();
  return data;
}

export const fetchLeaveGroup = async(groupId) => {
  const response = await fetch(`http://localhost:3000/api/group/${groupId}/leave`, {
    method: "PUT",
    headers: {
      Authorization: localStorage.getItem('token'),
    }
  });
  const data = await response.json();

  return data;
};

export const fetchSearchUsers = async(query) => {
  const response = await fetch(`http://localhost:3000/api/users/search/${query}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    }
  });
  const data = await response.json();
  return data;
}

export const fetchAddFriend = async(userId) => {
  const response = await fetch(`http://localhost:3000/api/user/friends/add/${userId}`, {
    method: "PUT",
    headers: {
      Authorization: localStorage.getItem('token'),
    }
  });
  const data = await response.json();
  return data;
};

export const fetchDeleteFriend = async(userId) => {
  const response = await fetch(`http://localhost:3000/api/user/friends/remove/${userId}`, {
    method: "PUT",
    headers: {
      Authorization: localStorage.getItem('token'),
    }
  });
  const data = await response.json();
  return data;
}

export const fetchEditProfile = async(body) => {
  const response = await fetch(`http://localhost:3000/api/user/profile/edit`, {
    method: "POST",
    body: body,
    headers: {
      Authorization: localStorage.getItem('token'),
    }
  });
  const data = await response.json();
  return data;
}