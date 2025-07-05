import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaGoogle, FaGithub, FaFacebook } from "react-icons/fa";
import { BiLogInCircle } from "react-icons/bi";
import { AuthContext } from "../App";
import "./Login.css";

export default function Login() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => { if (user) navigate("/dashboard"); }, [user, navigate]);

  const googleLogin   = () => window.open("http://localhost:5000/api/auth/google",   "_self");
  const githubLogin   = () => window.open("http://localhost:5000/api/auth/github",   "_self");
  const facebookLogin = () => window.open("http://localhost:5000/api/auth/facebook", "_self");

  return (
    <div className="ccontainer">
      <div className="logos"><a href="/"><span>SW</span></a></div>
      <div className="main-content">
        <div className="login-form">
          <BiLogInCircle className="form-icon" />
          <div className="social-login-container">
            <p className="or-text">Continue with</p>
            <button className="social-btn google"   onClick={googleLogin}>   <FaGoogle />  Google   </button>
            <button className="social-btn github"   onClick={githubLogin}>   <FaGithub />  GitHub   </button>
            <button className="social-btn facebook" onClick={facebookLogin}> <FaFacebook /> Facebook </button>
          </div>
        </div>
      </div>
      <div className="foot"><p>&copy; 2025</p></div>
    </div>
  );
}
