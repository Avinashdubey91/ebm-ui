import { useContext } from "react";
import { NavigationGuardContext } from "../context/NavigationGuardContext";

export const useNavigationGuardContext = () => {
  const context = useContext(NavigationGuardContext);

  if (!context) {
    throw new Error(
      "useNavigationGuardContext must be used within NavigationGuardProvider",
    );
  }

  return context;
};