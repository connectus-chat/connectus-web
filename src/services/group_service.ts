import { api } from "../api";
import { Group, Group2Create } from "../entities/group";

export class GroupService {
  async fetchAllByUserId(userId: string) {
    const { data } = await api.get<Group[]>(`/users/${userId}/groups`);
    return data;
  }

  async createAndAdd(
    newGroup: Group2Create,
    participantsIds: string[],
    adminId: string
  ) {
    const { data } = await api.post<Group>(
      `/users/${adminId}/groups`,
      newGroup
    );
    for (const id of participantsIds) {
      await api.post(`/users/${id}/groups/${data.id}`);
    }
    const updatedGroup = await api.get<Group>(`/users/groups/${data.id}`);
    return updatedGroup;
  }
}
