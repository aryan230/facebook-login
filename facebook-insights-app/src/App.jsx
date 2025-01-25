import React, { useState } from "react";
import Login from "./components/Login";
import Profile from "./components/Profile";
import PageDetails from "./components/PageDetails";

const App = () => {
  const [user, setUser] = useState(null);

  const handleLogin = (accessToken) => {
    setUser({ accessToken });
  };

  return (
    <div>
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Profile accessToken={user.accessToken} />
      )}
    </div>
  );
};

export default App;
