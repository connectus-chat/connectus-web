import * as Twofish from "twofish";
export class SymmetricKeyService {
  private str2ab(str: string) {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }

  async encrypt(key: string, message: string) {
    const twofish = new Twofish();
    const dataArray = this.str2ab(message);
    const keyArray = this.str2ab(key);
    const cipherText = twofish.encrypt(keyArray, dataArray);
    const encryptedString = cipherText
      .map((x: number) => x.toString(16).padStart(2, "0"))
      .join("");
    return encryptedString;
  }

  async decrypt(key: string, encryptedMessage: string) {
    const twofish = new Twofish();
    const encryptedMessageArray = this.str2ab(encryptedMessage);
    const keyArray = this.str2ab(key);
    const data = twofish.decrypt(keyArray, encryptedMessageArray);
    const decryptedString = data
      .map((x: number) => String.fromCharCode(x))
      .join("");

    return decryptedString;
  }
}
