import { fetchLogin } from "../helpers/apiHelper";
import "./account.css";
import { useState, useEffect } from "react";

export const Login = ({ setPage, setIsLoggedIn, setIsLoading, checkUser }) => {
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState([]);

  const handleOnChange = (e) => {
    e.preventDefault();
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value,
    });
  };

  const handleOnSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await fetchLogin(loginData);
      if (!data.success) {
        setErrors(data.error);
        return;
      }
      setIsLoggedIn(true);
      setErrors([]);
      setIsLoading(true);
      checkUser();
      setPage('home');
    } catch (error) {
      setErrors(["An error occurred while trying to login. Please try again later."])
    }
  };

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
    <div className="login-box">
      <div className="login-container">
        <h1>Login</h1>
        <form onSubmit={handleOnSubmit}>
          <div className="input-container">
            <label htmlFor="username">Username: </label>
            <input
              type="text"
              placeholder="Username"
              name="username"
              autoComplete="map-username"
              onChange={handleOnChange}
            />
          </div>
          <div className="input-container">
            <label htmlFor="password">Password: </label>
            <input
              type="password"
              placeholder="Password"
              name="password"
              autoComplete="map-password"
              onChange={handleOnChange}
            />
          </div>
          <div className="button-container">
            <button type="submit" className="button">
              Login
            </button>
          </div>
        </form>
        <p>
          Don't have an account?{" "}
          <a onClick={() => setPage("register")} className="signup-link">
            Sign up
          </a>
        </p>
      </div>
      <div className={`errors-container ${errors.length > 0 ? "show" : ""}`}>
        <div className="errors">
          {errors.map((err, i) => (
            <p key={i}>
              <strong>!</strong> {err}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};
