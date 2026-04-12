import { Link } from "react-router-dom";
import "./NotFound.css";

function NotFound() {
  return (
    <div className="notfound-page">
      <div className="notfound-code">404</div>
      <div className="notfound-icon">🩺</div>
      <h1 className="notfound-title">Page Not Found</h1>
      <p className="notfound-subtitle">
        The page you're looking for doesn't exist or has been moved. 
        Let's get you back to safety.
      </p>
      <Link to="/" className="notfound-btn">
        ← Back to Home
      </Link>
    </div>
  );
}

export default NotFound;
