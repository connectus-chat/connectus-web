import { api } from "../api";

export class AsymmetricKeyService {
  async findPrivateKey(id: string) {
    try {
      const { data } = await api.get<{ privateKey: string }>(
        `/users/${id}/auth/private`
      );
      return data.privateKey;
    } catch (error) {
      return undefined;
    }
  }

  async decrypt(privateKey: string, encryptedData: string) {
    // TODO
    return encryptedData;
  }
}
