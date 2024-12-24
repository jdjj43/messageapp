import React, { useState, useEffect } from "react";
import "./App.css";
import Icon from "@mdi/react";
import {
  mdiHomeOutline,
  mdiMagnify,
  mdiAccount,
  mdiEmailOutline,
  mdiAccountMultiple,
  mdiAccountGroup,
  mdiLogin,
  mdiAccountPlus,
  mdiAlertCircleOutline,
} from "@mdi/js";
import { Home } from "./Home/Home";
import { Guest } from "./Home/Guest";
import { Login } from "./Account/Login";
import { Register } from "./Account/Register";
import { fetchAddFriend, fetchSearchUsers, fetchSession } from "./helpers/apiHelper";
import { Profile } from "./Profile/Profile";
import { Messages } from "./Messages/Messages";
import { Chat } from "./Chat/Chat";
import LoadingScreen from "./Loading";
import { Group } from "./Chat/Group";
import { Friends } from "./Friends/Friends";
import { Search } from "./Search";
import { OUserProfile } from "./Profile/OUserProfile/OUserProfile";
import { Groups } from "./Groups/Groups";
const App = () => {
  const [page, setPage] = useState("home");
  const dateNow = Date.now();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userInfo, setUserInfo] = useState({});
  const [userProfileId, setUserProfileId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState('');
  const [errors, setErrors] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const [friendsPage, setFriendsPage] = useState({
    userId: '',
    name: '',
  });

  const [imageReloadToken, setImageReloadToken] = useState(Date.now());

  const reloadImage = () => {
    setImageReloadToken(Date.now());
  }

  const handleFriendsPage = (userId, name) => {
    setFriendsPage({
      userId: userId,
      name: name, 
    })
    setPage('friends');
  }

  

  const checkUser = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const data = await fetchSession();
        setUserInfo(data.user);
        setUserProfileId(data.user._id);
        setIsLoggedIn(true);
        setIsLoading(false);
      } catch (error) {
        setErrors(["An error occurred with the api. Please try again later."]);
        setIsLoading(false);
      }
      return;
    } else {
      setPage("home");
      setIsLoggedIn(false);
      setIsLoading(false);
    }
  };
  const handleOpenMenu = (e) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  }
  const handleLogOut = (e) => {
    e.stopPropagation();
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setPage('home');
  };
  const handleProfileId = (id) => {
    setUserProfileId(id);
    setPage("profile");
  }
  const handleOProfileId = (id) => {
    setUserProfileId(id);
    setPage("oUProfile");
  }
  const renderContent = () => {
    if (!isLoggedIn) {
      switch (page) {
        case "home":
          return <Guest setPage={setPage} />;
        case "login":
          return (
            <Login
              setPage={setPage}
              setIsLoggedIn={setIsLoggedIn}
              setIsLoading={setIsLoading}
              checkUser={checkUser}
            />
          );
        case "register":
          return <Register setPage={setPage} />;
        default:
          return <>Page not found</>;
      }
    }
    
    switch (page) {
      case "home":
        return <Home user={userInfo._id} nowDate={dateNow} setChatId={setChatId} setPage={setPage} handleOProfileId={handleOProfileId} handleFriendsPage={handleFriendsPage} />;
      case "profile":
        return <Profile user={userInfo._id} userProfile={userProfileId} handleProfileId={handleOProfileId} nowDate={dateNow} setChatId={setChatId} setPage={setPage} handleFriendsPage={handleFriendsPage} reloadImageNav={reloadImage}/>;
      case "messages":
        return <Messages user={userInfo._id} nowDate={dateNow} setChatId={setChatId} setPage={setPage} />;
      case "friends":
        return <Friends friendsPage={friendsPage} handleOProfileId={handleOProfileId} />;
      case "groups":
        return <Groups setChatId={setChatId} setPage={setPage} />;
      case "chat":
        return <Chat user={userInfo._id} chatId={chatId} nowDate={dateNow} setPage={setPage} handleOProfileId={handleOProfileId} />;
      case "group":
        return <Group user={userInfo._id} groupId={chatId} nowDate={dateNow} setPage={setPage} />;
      case "search":
        return <Search query={userSearch} userSession={userInfo} searchResults={searchResults} handleOProfileId={handleOProfileId} />;
      case "oUProfile":
        return <OUserProfile userId={userProfileId} setChatId={setChatId} setPage={setPage} handleFriendsPage={handleFriendsPage} />;
      default:
        return <>Page not found</>;
    }
  };
  const handleSearch = async(e) => {
    e.preventDefault();
    try {
      if(userSearch === '') return;
      const request = await fetchSearchUsers(userSearch);
      setSearchResults(request);
      setPage('search');
    } catch (error) {
      setErrors(['There was an error with the API.']);
    }
  };

  useEffect(() => {
    const userFunction = async () => {
      await checkUser();
    }
    userFunction();
  }, []);

  useEffect(() => {
    const checkSearch = () => {
      if (page !== 'search') {
        setUserSearch('');
      }
    }
    checkSearch();
  }, [page]);

  if (errors.length > 0) {
    {
      errors.map((error, index) => <div key={index}>{error}</div>);
    }
    return (
      <div className="error-container">
        <Icon path={mdiAlertCircleOutline} size={25} />
        <h2>Oops, something went wrong!</h2>
        <div>
          {errors.map((error, index) => (
            <div key={index}>{error}</div>
          ))}
        </div>
      </div>
    );
  }
  if (isLoading) return <LoadingScreen />;
  return (
    <>
      <div className="container" onClick={() => setIsMenuOpen(false)}>
        <div className="nav">
          <div className="logo" onClick={() => setPage("home")}>
            <h1>✅Message App</h1>
          </div>
          {isLoggedIn ? (
            <div className="links">
              <div>
                <a className="icon-link" onClick={() => setPage("home")}>
                  <Icon path={mdiHomeOutline} size={2} className="icon" />
                  <p>Home</p>
                </a>
              </div>
              <div>
                <a className="icon-link" onClick={() => handleProfileId(userInfo._id)}>
                  <Icon path={mdiAccount} size={2} className="icon" />
                  <p>Profile</p>
                </a>
              </div>
              <div>
                <a className="icon-link" onClick={() => setPage('messages')}>
                  <Icon path={mdiEmailOutline} size={2} className="icon" />
                  <p>Messages</p>
                </a>
              </div>
              <div>
                <a className="icon-link" onClick={() => handleFriendsPage(userInfo._id, 'self')}>
                  <Icon path={mdiAccountMultiple} size={2} className="icon" />
                  <p>Friends</p>
                </a>
              </div>
              <div>
                <a className="icon-link" onClick={() => setPage("groups")}>
                  <Icon path={mdiAccountGroup} size={2} className="icon" />
                  <p>Groups</p>
                </a>
              </div>
            </div>
          ) : (
            <div className="links">
              <div>
                <a className="icon-link" onClick={() => setPage("login")}>
                  <Icon path={mdiLogin} size={2} className="icon" />
                  <p>Login</p>
                </a>
              </div>
              <div>
                <a className="icon-link" onClick={() => setPage("register")}>
                  <Icon path={mdiAccountPlus} size={2} className="icon" />
                  <p>Register</p>
                </a>
              </div>
            </div>
          )}
          <div className="nav-background"></div>
          <div className="nav-color"></div>
        </div>
        <div className="content-container">
          {isLoggedIn ? (
            <div className="top-bar">
              <form className="search" onSubmit={(e) => handleSearch(e)}>
                <input type="text" placeholder="Search User..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
                <button type="submit">
                  <Icon path={mdiMagnify} size={1.7} />
                </button>
              </form>
              <div className={`user-btn ${isMenuOpen ? 'user-btn-selected' : ''}`} onClick={(e) => handleOpenMenu(e)}>
                <div className="user-img">
                  {userInfo.profile.profile_thumbnail &&
                    userInfo.profile.profile_thumbnail !== undefined && (
                      <img
                        src={`http://localhost:3000/api/user/profile/thumbnail/${userInfo._id}?timestamp=${imageReloadToken}`}
                        alt="User Avatar"
                        className="user-img-icon"
                      ></img>
                    )}
                  {userInfo.profile.profile_thumbnail === undefined && (
                    <img
                      src="https://www.gravatar.com/avatar/00000000000000000000000000000000?d=identicon&f=y"
                      alt="User Avatar"
                      className="user-img-icon"
                    />
                  )}
                </div>
                <div className="username">{userInfo.name}</div>
              </div>
              {
                isMenuOpen && (
                  <div className="menu">
                    <div className="menu-button" onClick={(e) => handleLogOut(e)}>
                      <p className="menu-item" >Logout</p>
                    </div>
                  </div>
                )
              }
            </div>
          ) : (
            <div className="top-bar"></div>
          )}
          <div className="content" id="content">{renderContent()}</div>
        </div>
      </div>
    </>
  );
};

export default App;
