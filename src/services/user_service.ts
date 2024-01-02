import { api } from "../api";
import { User, User2Create } from "../entities/user";

const PATH = "/users";
export const LOCAL_AUTH = "authid";
export class UserService {
  logout() {
    sessionStorage.removeItem(LOCAL_AUTH);
  }

  hasAuth() {
    const authid = sessionStorage.getItem(LOCAL_AUTH);
    return !!authid;
  }

  async login(username: string, password: string) {
    try {
      const { data } = await api.post<User>(`${PATH}/login`, {
        username,
        password,
      });
      sessionStorage.setItem(LOCAL_AUTH, data.id);
      return data;
    } catch (error) {
      return undefined;
    }
  }

  async fetchAll() {
    const { data } = await api.get<User[]>(PATH);
    return data;
  }

  async findById(id: string) {
    try {
      const { data } = await api.get<User>(`${PATH}/${id}`);
      return data;
    } catch (error) {
      return undefined;
    }
  }

  async getAuthenticatedUser() {
    try {
      const id = sessionStorage.getItem(LOCAL_AUTH);
      if (!id) throw new Error("Usuário sem as credenciais necessárias");
      const { data } = await api.get<User>(`${PATH}/${id}`);
      return data;
    } catch (error) {
      return undefined;
    }
  }

  async create(newUser: User2Create) {
    try {
      const { data } = await api.post<User>(PATH, newUser);
      return data;
    } catch (error) {
      return undefined;
    }
  }

  async follow(user2Follow: string) {
    try {
      const id = sessionStorage.getItem(LOCAL_AUTH);
      if (!id) throw new Error("Usuário sem as credenciais necessárias");
      const { data } = await api.post<User>(
        `/users/${id}/follow/${user2Follow}`
      );
      await api.post(`/users/${user2Follow}/follow/${id}`);
      return data;
    } catch (error) {
      return undefined;
    }
  }
}
