import { Group } from "./group";

export interface User {
  id: string;
  name: string;
  username: string;
  password: string;
  age: number;
  email: string;
  groups: Group[];
  friends: User[];
}

export type User2Create = Pick<
  User,
  "name" | "username" | "age" | "email" | "password"
>;

export type User2Update = Partial<User2Create>;

export type OptionalUser = User | null | undefined;
