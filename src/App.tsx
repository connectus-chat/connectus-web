import { RouterProvider } from "react-router-dom";
import { router } from "./routes";

import { NotificationProvider } from "./contexts/Notifications";
import "./global-styles.css";

export const App: React.FC = () => {
  return (
    <NotificationProvider>
      <RouterProvider router={router} />
    </NotificationProvider>
  );
};
