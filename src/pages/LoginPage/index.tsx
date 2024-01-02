import { FormEvent } from "react";
import { Header } from "../../components/Header";

import { useNavigate } from "react-router-dom";
import LogoImg from "../../assets/badget.svg";
import { getFormData } from "../../components/Forms/get_form_data";
import { useNotification } from "../../hooks/useNotification";
import { UserService } from "../../services/user_service";
import "./styles.css";

const userService = new UserService();

export const LoginPage: React.FC = () => {
  const { pushNotification, clearAllNotifications } = useNotification();
  const navigate = useNavigate();

  async function onSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const data = getFormData(formEvent.currentTarget);
    const { username, password } = data;
    const auth = await userService.login(username, password);
    if (!auth) {
      pushNotification({
        message: "Usuário e/ou senha inválidos.",
        type: "error",
      });
      return;
    }
    clearAllNotifications();
    navigate("/home");
  }

  return (
    <div className="login-page">
      <Header />
      <form className="form" onSubmit={onSubmit}>
        <img className="logo" src={LogoImg} alt="connectus.chat" />
        <h1 className="title">Login</h1>
        <div className="content">
          <input
            type="text"
            name="username"
            className="ipt"
            placeholder="Digite seu nome de usuário"
            required
          />

          <input
            type="password"
            name="password"
            className="ipt"
            placeholder="Digite sua senha"
            required
          />

          <button className="bt primary submit" type="submit">
            Entrar
          </button>
        </div>

        <p className="info">
          Ainda não possui conta?
          <a onClick={() => navigate("signup")}>
            Clique aqui para criar sua conta.
          </a>
        </p>
      </form>
    </div>
  );
};
