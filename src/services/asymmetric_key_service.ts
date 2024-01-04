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

  private str2ab(str: string) {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }

  private importPrivateKey(pem: string) {
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    const pemContents = pem.substring(
      pemHeader.length,
      pem.length - pemFooter.length
    );
    // base64 -> binary data
    const binaryDerString = window.atob(pemContents);
    // binary string -> ArrayBuffer
    const binaryDer = this.str2ab(binaryDerString);

    return window.crypto.subtle.importKey(
      "pkcs8",
      binaryDer,
      {
        name: "RSA-PSS",
        hash: "SHA-256",
      },
      true,
      ["sign"]
    );
  }

  async decrypt(privateKey: string, encryptedData: string) {
    const cryptKeyFromPrivateKey = await this.importPrivateKey(privateKey);
    const decryptedDataWithPrivateKey = window.crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      cryptKeyFromPrivateKey,
      new TextEncoder().encode(encryptedData)
    );
    return decryptedDataWithPrivateKey;
  }
}
