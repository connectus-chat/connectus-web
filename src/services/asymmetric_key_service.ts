import { api } from "../api";

export class AsymmetricKeyService {
  async findPrivateKey(id: string) {
    try {
      const { data } = await api.get<{ privateKey: string }>(
        `/users/${id}/auth/private`
      );
      return data.privateKey;
    } catch (error: any) {
      const msg = error.message | error;
      throw new Error(`Error finding private key: ${msg}`);
    }
  }

  private base64ToArrayBuffer(base64: string) { 
    const binaryString = atob(base64); 
    const length = binaryString.length; 
    const arrayBuffer = new ArrayBuffer(length); 
    const uint8Array = new Uint8Array(arrayBuffer); 
    for (let i = 0; i < length; i++) { 
        uint8Array[i] = binaryString.charCodeAt(i); 
    } 
    return arrayBuffer; 
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

    console.log("pre: ", binaryDer);
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
      console.log("Chave privada importada: ", importedPrivateKey);

      // base64 -> binary data
      const binaryDerString = window.atob(encryptedData);
      // binary string -> ArrayBuffer
      const encodedData = this.str2ab(binaryDerString);
      
      const decryptedData = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        importedPrivateKey,
        encodedData
    );
      console.log("Chave de sessao: ", decryptedData);
      return new TextDecoder().decode(decryptedData);
    } catch(error: any){
      const msg = error;
      throw new Error(`Error decrypting private key: ${msg}`);
    }
  }
}
