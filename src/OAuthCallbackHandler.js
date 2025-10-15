import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function OAuthCallbackHandler() {
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Parse the "code" param from URL
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!code) {
      setError("No authorization code found");
      return;
    }

    // 2. Send code to backend to exchange for access token
    fetch("http://localhost:4000/auth/github", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .then(res => res.json())
      .then(data => {
        // handle backend response (user, token, error, etc)
        if (data.success) {
          localStorage.setItem("isLoggedIn", "true");
          // You can store token/user info if needed
          navigate("/", { replace: true });
        } else {
          setError(data.error || "Login failed");
        }
      })
      .catch(() => setError("Could not connect to backend"));
  }, [navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "4rem", color: "#fff" }}>
      <h2>OAuth Callback</h2>
      {error ? <p>{error}</p> : <p>Logging in with GitHub...</p>}
    </div>
  );
}

export default OAuthCallbackHandler;
