import { api } from "../api";

export class AsymmetricKeyService {
  async findPrivateKey(id: string) {
    try {
      const { data } = await api.get<{ privateKey: string }>(
        `/users/${id}/auth/private`
      );
      return data.privateKey;
    } catch (error) {
      const msg = error;
      throw new Error(`Error finding private key: ${msg}`);
    }
  }

  private str2ab(str: string) {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }

  private async importPrivateKey(pem: string) {
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    const pemContents = pem.substring(
      pemHeader.length,
      pem.length - pemFooter.length - 1
    );
    // base64 -> binary data
    const binaryDerString = window.atob(pemContents);
    // binary string -> ArrayBuffer
    const binaryDer = this.str2ab(binaryDerString);

    const importedPrivateKey = await window.crypto.subtle.importKey(
      "pkcs8",
      binaryDer,
      {
        name: "RSA-OAEP",
        hash: { name: "SHA-256" },
      },
      false,
      ["decrypt"]
    );
    return importedPrivateKey;
  }

  async decrypt(privateKey: string, encryptedData: string) {
    try {
      const importedPrivateKey = await this.importPrivateKey(privateKey);

      // base64 -> binary data
      const binaryDerString = window.atob(encryptedData);
      // binary string -> ArrayBuffer
      const encodedData = this.str2ab(binaryDerString);

      const decryptedData = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        importedPrivateKey,
        encodedData
      );
      return new TextDecoder().decode(decryptedData);
    } catch (error) {
      const msg = error;
      throw new Error(`Error decrypting private key: ${msg}`);
    }
  }
}
