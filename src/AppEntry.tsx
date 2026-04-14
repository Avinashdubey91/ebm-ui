import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { NotificationProvider } from "./context/NotificationProvider";
import { NavigationGuardProvider } from "./context/NavigationGuardProvider";

const AppEntry = () => (
  <BrowserRouter>
    <NavigationGuardProvider>
      <NotificationProvider>
        <AppRoutes />
      </NotificationProvider>
    </NavigationGuardProvider>
  </BrowserRouter>
);

export default AppEntry;