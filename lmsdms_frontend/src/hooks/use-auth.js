import { AuthContext } from "context/auth-context";
import { useContext } from "react";

export const useAuth = () => {
  if(!AuthContext) return

  return useContext(AuthContext);
};