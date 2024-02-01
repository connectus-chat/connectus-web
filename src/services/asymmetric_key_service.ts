import { api } from "../api";

export interface Credentials {
  publicKey: string;
  privateKey: string;
}

export class AsymmetricKeyService {
  async generateRSAKeyPair(): Promise<Credentials> {
    const keyPair: CryptoKeyPair = await crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
        hash: { name: "SHA-256" },
      },
      true,
      ["encrypt", "decrypt"]
    );

    const exportedPubKey = await crypto.subtle.exportKey(
      "spki",
      keyPair.publicKey
    );
    const exportedPubKeyBase64 = btoa(
      String.fromCharCode(...new Uint8Array(exportedPubKey))
    );

    const exportedPrivKey = await crypto.subtle.exportKey(
      "pkcs8",
      keyPair.privateKey
    );
    const exportedPrivKeyBase64 = btoa(
      String.fromCharCode(...new Uint8Array(exportedPrivKey))
    );

    return {
      publicKey: exportedPubKeyBase64,
      privateKey: exportedPrivKeyBase64,
    };
  }

  findPrivateKey(id: string) {
    try {
      const publicKey = localStorage.getItem(`${id}-privatekey`);
      return publicKey;
    } catch (error) {
      throw new Error(`Error finding private key: ${error}`);
    }
  }

  async findPublicKey(id: string): Promise<string> {
    try {
      const { data } = await api.get<string>(`/users/${id}/credentials`);
      return data;
    } catch (error) {
      throw new Error(`Error finding public key: ${error}`);
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

  async encrypt(key: string, message: Uint8Array): Promise<string> {
    const binarykey = atob(key);
    const byteNumbers = new Array(binarykey.length);
    for (let i = 0; i < binarykey.length; i++) {
      byteNumbers[i] = binarykey.charCodeAt(i);
    }
    const arrayBuffer = new ArrayBuffer(byteNumbers.length);
    const unit8Array = new Uint8Array(arrayBuffer);
    // const messageBuffer = new TextEncoder().encode(message);
    for (let i = 0; i < byteNumbers.length; i++) {
      unit8Array[i] = byteNumbers[i];
    }
    const keyCrypto = await crypto.subtle.importKey(
      "spki",
      unit8Array,
      { name: "RSA-PSS", hash: "SHA-256" },
      true,
      ["verify"]
    );
    const encryptedKey = await crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      keyCrypto,
      message
    );

    const decoder = new TextDecoder("utf-8");
    const encryptedString = decoder.decode(encryptedKey);

    return encryptedString;
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
