import { useEffect, useState } from "react";
import { fetchRegister } from "../helpers/apiHelper";

export const Register = ({ setPage }) => {
  const [errorList, setErrorList] = useState([]);
  const [registered, setRegistered] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    password: '',
    repeat_password: '',
  });

  const handleOnChange = (e) => {
    setRegisterForm({
      ...registerForm, [e.target.name]: e.target.value
    });
  };

  const handleOnSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await fetchRegister(registerForm);
      if (data.success) {
        setErrorList([]);
        setRegistered(true);
      } else {
        setErrorList(data.errors);
      };
    } catch (error) {
      setErrorList(['An error occurred while fetching. Please try again later.'])
    };
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
  }, []);

  return (
    <div className="login-box">
      {!registered ? (<div className="register-container">
        <h1>Register</h1>
        <form onSubmit={(e) => handleOnSubmit(e)}>
          <div className="register-double-input">
            <div className="input-container">
              <label htmlFor="first_name">First Name:</label>
              <input type="text" name="first_name" autoComplete="map-first_name" placeholder="Your Name" onChange={(e) => handleOnChange(e)} />
            </div>
            <div className="input-container">
              <label htmlFor="last_name">Last Name:</label>
              <input type="text" name="last_name" autoComplete="map-last_name" placeholder="Your Last Name" onChange={(e) => handleOnChange(e)} />
            </div>
          </div>
          <div className="input-container">
            <label htmlFor="username">Username: </label>
            <input
              type="text"
              placeholder="Username"
              name="username"
              autoComplete="map-username"
              onChange={(e) => handleOnChange(e)}
            />
          </div>
          <div className="input-container">
            <label htmlFor="password">Password: </label>
            <input
              type="password"
              placeholder="Password"
              name="password"
              onChange={(e) => handleOnChange(e)}
            />
          </div>
          <div className="input-container">
            <label htmlFor="repeat_password">Repeat Password: </label>
            <input
              type="password"
              placeholder="Repeat Your Password"
              name="repeat_password"
              onChange={(e) => handleOnChange(e)}
            />
          </div>
          <div className="button-container">
            <button type="submit" className="button">
              Register
            </button>
          </div>
        </form>
        <p>
          Already have an account?{" "}
          <a onClick={() => setPage("login")} className="signup-link">
            Login
          </a>
        </p>
      </div>) : (
        <div className="register-container registered">
          <h1>You have been registered succesfully!</h1>
          <div className="text">
            <p>Congrats on your new account!</p>
            <p><span onClick={() => setPage('login')}>Click here</span> to login now!</p>
          </div>
        </div>
      )}
      {errorList.length > 0 && !registered ? (
        <div className={`errors-container ${errorList.length > 0 ? "show" : ""}`}>
          <div className="errors">
            {errorList.map(error => (
              <p key={error.path}>
                <strong>!</strong> {error.msg}
              </p>
            ))}
          </div>
        </div>
      ) : null}

    </div>
  );
};