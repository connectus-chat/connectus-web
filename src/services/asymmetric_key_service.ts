import { api } from "../api";

export interface Credentials {
  publicKey: string;
  privateKey: string;
}

const algorithm = {
  name: 'RSA-OAEP',
  modulusLength: 2048,
  publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
  hash: { name: 'SHA-256' }
}

export class AsymmetricKeyService {
  async generateRSAKeyPair(): Promise<Credentials> {
    const keyPair: CryptoKeyPair = await crypto.subtle.generateKey(algorithm, true, ['encrypt', 'decrypt']);

    const exportedPubKey = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    const exportedPubKeyBase64 = JSON.stringify(exportedPubKey);
    
    const exportedPrivKey = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);
    const exportedPrivKeyBase64 = JSON.stringify(exportedPrivKey);

    return {
      publicKey: exportedPubKeyBase64,
      privateKey: exportedPrivKeyBase64,
    }
  }

  findPrivateKey(id: string) {
    try {
      const publicKey = localStorage.getItem(`${id}-privatekey`);
      return publicKey
    } catch(error) {
      throw new Error(`Error finding private key: ${error}`)
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
      algorithm,
      false,
      ["decrypt"]
    );
    return importedPrivateKey;
  }

  async importPublicKey(key: string) {
    const encrypted = await window.crypto.subtle.importKey(
      "jwk",
      JSON.parse(key),
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["encrypt"]
    );
    return encrypted;
}

  async encrypt(
    key: string, message: string): Promise<ArrayBuffer | undefined>{
    try {  
      const encoder = new TextEncoder();
      const encodedMessage = encoder.encode(message);
      const pubKey = await this.importPublicKey(key);
      const encryptedData = await window.crypto.subtle.encrypt(
        {
            name: "RSA-OAEP"
        },
        pubKey,
        encodedMessage
    );
    return encryptedData;

    } catch(error) {
      console.error('Erro ao encriptar twofish: ', error);
    }
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
