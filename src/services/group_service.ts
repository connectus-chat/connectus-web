import { api } from "../api";
import { Group, Group2Create } from "../entities/group";
import { getAuth } from "./user_service";

export class GroupService {
  async fetchAllByUserId(userId: string) {
    const { data } = await api.get<Group[]>(
      `/users/${userId}/groups?auth=${getAuth()}`
    );
    return data;
  }

  async createAndAdd(
    newGroup: Group2Create,
    participantsIds: string[],
    adminId: string
  ) {
    const { data } = await api.post<Group>(
      `/users/${adminId}/groups?auth=${getAuth()}`,
      newGroup
    );
    for (const id of participantsIds) {
      await api.post(`/users/${id}/groups/${data.id}?auth=${getAuth()}`);
    }
    const updatedGroup = await api.get<Group>(
      `/users/groups/${data.id}?auth=${getAuth()}`
    );
    return updatedGroup;
  }
}
