import "./styles.css";

import { useNavigate } from "react-router-dom";
import LogoImg from "../../assets/badge.svg";
import { UserService } from "../../services/user_service";

const userService = new UserService();

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = userService.hasAuth();

  function handleLogout() {
    userService.logout();
    navigate("/");
  }

  return (
    <header className="header">
      <img onClick={() => navigate("/")} src={LogoImg} alt="connectus.chat" />
      {isAuthenticated && (
        <button onClick={handleLogout} className="bt primary">
          SAIR
        </button>
      )}
    </header>
  );
};
