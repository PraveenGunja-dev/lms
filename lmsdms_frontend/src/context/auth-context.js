import { createContext, useState } from "react";
import PropTypes from "prop-types";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [initialState, setInitialState] = useState({
    user: JSON.parse(localStorage.getItem("user")),
    token: localStorage.getItem("token"),
    role: JSON.parse(localStorage.getItem('user_role'))
  });

  const updateUser = (data, token) => {
    localStorage.setItem("user", JSON.stringify(data));
    localStorage.setItem("token", token);
    setInitialState((prev) => ({...prev, user:data, token}));
  };

  const updateRole = (role) => {
    localStorage.setItem("user_role", JSON.stringify(role))
    setInitialState((prev) =>({...prev, role}));
  } 

  const logoutUser = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("user_role");
    setInitialState((prev) => ({ ...prev, user: null, token: "" }));
  };

  return (
    <AuthContext.Provider
      value={{
        ...initialState,
        updateUser,
        logoutUser,
        updateRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};