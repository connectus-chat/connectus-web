import { User } from "./user";

export interface Group {
  id: string;
  title: string;
  adminId: string;
  admin: User;
  participants: User[];
}

export type Group2Create = Pick<Group, "title">;

export type Group2Update = Partial<Group2Create>;

export type OptionalGroup = Group | null | undefined;
