import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
          background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
          padding: "20px",
          textAlign: "center"
        }}>
          <div style={{
            fontSize: "5rem",
            marginBottom: "20px",
            animation: "bounce 2s infinite"
          }}>
            🩺
          </div>
          <h1 style={{
            fontSize: "2rem",
            color: "#1e293b",
            marginBottom: "10px",
            fontWeight: 800
          }}>
            Oops! Something went wrong
          </h1>
          <p style={{
            color: "#64748b",
            fontSize: "1.1rem",
            maxWidth: "450px",
            lineHeight: 1.6,
            marginBottom: "30px"
          }}>
            Don't worry, your data is safe. The application encountered an unexpected error. 
            Click below to return to the homepage.
          </p>
          <button
            onClick={this.handleReset}
            style={{
              padding: "14px 40px",
              background: "linear-gradient(135deg, #0a4db8, #1e6ff0)",
              color: "white",
              border: "none",
              borderRadius: "50px",
              fontSize: "1rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(10, 77, 184, 0.3)",
              transition: "all 0.3s ease"
            }}
          >
            Go to Homepage
          </button>
          <style>{`
            @keyframes bounce {
              0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
              40% { transform: translateY(-20px); }
              60% { transform: translateY(-10px); }
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
