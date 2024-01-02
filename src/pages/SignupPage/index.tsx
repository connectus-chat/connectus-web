import { FormEvent } from "react";
import { Header } from "../../components/Header";

import { useNavigate } from "react-router-dom";
import LogoImg from "../../assets/badget.svg";
import { getFormData } from "../../components/Forms/get_form_data";
import { User2Create } from "../../entities/user";
import { useNotification } from "../../hooks/useNotification";
import { UserService } from "../../services/user_service";
import "./styles.css";

const userService = new UserService();

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { pushNotification } = useNotification();

  async function onSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const data = getFormData(formEvent.currentTarget);
    const { name, username, email, date, password, confirmPassword } = data;

    if (password !== confirmPassword) {
      pushNotification({
        message: "Senhas devem ser iguais.",
        type: "warning",
      });
      return;
    }

    const age = new Date().getFullYear() - new Date(date).getFullYear();

    const newUser: User2Create = {
      age,
      email,
      name,
      password,
      username,
    };

    const createdUser = await userService.create(newUser);

    if (!createdUser) {
      pushNotification({
        message: "Não foi possível criar um novo usuário.",
        type: "error",
      });
      return;
    }

    pushNotification({
      message: "Usuário criado com sucesso.",
      type: "success",
    });
    navigate("/");
  }

  return (
    <div className="signup-page">
      <Header />
      <form className="form" onSubmit={onSubmit}>
        <img className="logo" src={LogoImg} alt="connectus.chat" />
        <h1 className="title">Cadastrar-se</h1>
        <div className="content">
          <label>Nome completo</label>
          <input
            type="text"
            name="name"
            className="ipt"
            placeholder="Digite seu nome completo"
            required
          />

          <label>Usuário</label>
          <input
            type="text"
            name="username"
            className="ipt"
            placeholder="Digite seu nome de usuário"
            required
          />

          <label>E-mail</label>
          <input
            type="email"
            name="email"
            className="ipt"
            placeholder="Digite seu e-mail"
            required
          />

          <label>Data de nascimento</label>
          <input
            type="date"
            name="date"
            className="ipt"
            placeholder="Data de nascimento"
            required
          />

          <label>Senha</label>
          <input
            type="password"
            name="password"
            className="ipt"
            placeholder="Digite sua senha"
            required
          />

          <input
            type="password"
            name="confirmPassword"
            className="ipt"
            placeholder="Confirme sua senha"
            required
          />

          <button className="bt primary submit" type="submit">
            Cadastrar
          </button>
        </div>

        <p className="info">
          Você já possui uma conta?
          <a onClick={() => navigate("/")}>Clique aqui para fazer login.</a>
        </p>
      </form>
    </div>
  );
};
