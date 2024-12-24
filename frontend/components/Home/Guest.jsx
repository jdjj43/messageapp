import { useEffect } from "react";
import "./Guest.css";
export const Guest = ({ setPage }) => {

  useEffect(() => {
    const content = document.getElementById('content');
    if (content) {
      content.classList.add('content_account');
    }
    return () => {
      if (content) {
        content.classList.remove("content_account");
      }
    };
  }, [])

  return (
    <div className="container-top">
      <div className="guest-background"></div>
      <div className="guest-background-color"></div>
      <div className="black-transparent"></div>
      <div className="guest-container">
        <h1>Welcome to Message App</h1>
        <p>Your place to stay connected with friends and family.</p>
        <div className="guest-links">
          <p>
            To start chatting{" "}
            <a onClick={() => setPage('login')} className="btn">
              Login
            </a>{" "}
            or{" "}
            <a onClick={() => setPage('register')} className="btn">
              Sign Up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
