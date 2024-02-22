import { api } from "../api";
import { getAuth } from "./user_service";

export interface Credentials {
  publicKey: string;
  privateKey: string;
}

const algorithm = {
  name: "RSA-OAEP",
  modulusLength: 2048,
  publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
  hash: { name: "SHA-256" },
};

export class AsymmetricKeyService {
  async generateRSAKeyPair(): Promise<Credentials> {
    console.log("GENERATING RSA KEYS");
    const keyPair: CryptoKeyPair = await crypto.subtle.generateKey(
      algorithm,
      true,
      ["encrypt", "decrypt"]
    );

    const exportedPubKey = await crypto.subtle.exportKey(
      "jwk",
      keyPair.publicKey
    );
    const exportedPubKeyBase64 = this.utf8_to_b64(
      JSON.stringify(exportedPubKey)
    );

    const exportedPrivKey = await window.crypto.subtle.exportKey(
      "jwk",
      keyPair.privateKey
    );
    const exportedPrivKeyBase64 = this.utf8_to_b64(
      JSON.stringify(exportedPrivKey)
    );

    console.log("NEW PUBLIC KEY", exportedPubKeyBase64);
    console.log("NEW PRIVATE KEY", exportedPrivKeyBase64);
    return {
      publicKey: exportedPubKeyBase64,
      privateKey: exportedPrivKeyBase64,
    };
  }

  utf8_to_b64(str: string) {
    return btoa(encodeURIComponent(str));
  }

  b64_to_utf8(str: string) {
    const cleanedValue = str.replaceAll('"', "");
    return decodeURIComponent(atob(cleanedValue));
  }

  findPrivateKey(id: string) {
    try {
      const privateKey = localStorage.getItem(`${id}-privatekey`);
      return privateKey;
    } catch (error) {
      throw new Error(`Error finding private key: ${error}`);
    }
  }

  async findPublicKey(id: string): Promise<string> {
    try {
      const { data } = await api.get<string>(
        `/users/${id}/credentials?auth=${getAuth()}`
      );
      return data;
    } catch (error) {
      throw new Error(`Error finding public key: ${error}`);
    }
  }

  ab2b64(arrayBuffer: ArrayBuffer) {
    return btoa(
      String.fromCharCode.apply(null, [...new Uint8Array(arrayBuffer)])
    );
  }

  b642ab(base64string: string) {
    return Uint8Array.from(atob(base64string), (c) => c.charCodeAt(0));
  }

  private async importPrivateKey(pem: string) {
    const jsonKey = this.b64_to_utf8(pem);
    const key = JSON.parse(jsonKey);
    const importedKey = await window.crypto.subtle.importKey(
      "jwk",
      key,
      algorithm,
      true,
      ["decrypt"]
    );
    return importedKey;
  }

  async importPublicKey(pem: string) {
    const jsonKey = this.b64_to_utf8(pem);
    const key = JSON.parse(jsonKey);
    const importedKey = await window.crypto.subtle.importKey(
      "jwk",
      key,
      algorithm,
      true,
      ["encrypt"]
    );
    return importedKey;
  }

  async encrypt(key: string, message: string) {
    try {
      const encodedMessage = new TextEncoder().encode(message);
      const pubKey = await this.importPublicKey(key);
      const encryptedData = await window.crypto.subtle.encrypt(
        algorithm,
        pubKey,
        encodedMessage
      );
      return this.ab2b64(encryptedData);
    } catch (error) {
      console.error("Erro ao encriptar twofish: ", error);
    }
  }

  async decrypt(privateKey: string, encryptedData: string) {
    try {
      const importedPrivateKey = await this.importPrivateKey(privateKey);
      // binary string -> ArrayBuffer
      const encodedData = this.b642ab(encryptedData);
      const decryptedData = await window.crypto.subtle.decrypt(
        algorithm,
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
