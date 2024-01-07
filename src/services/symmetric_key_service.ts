import * as twf from "twofish";
export class SymmetricKeyService {
  private str2ab(str: string) {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }

  private hexStringToByteArray(hexString: string) {
    const byteArray = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < byteArray.length; i++) {
      byteArray[i] = parseInt(hexString.slice(i * 2, i * 2 + 2), 16);
    }
    return byteArray;
  }

  async encrypt(key: string, message: string) {
    const twofish = twf.twofish();
    const dataArray = this.str2ab(message);
    const keyArray = this.str2ab(key);
    const cipherText = twofish.encrypt(keyArray, dataArray);
    const encryptedString: string = cipherText
      .map((x: number) => x.toString(16).padStart(2, "0"))
      .join("");
    return encryptedString;
  }

  async decrypt(key: string, encryptedMessage: string) {
    const twofish = twf.twofish();
    const encryptedMessageArray = this.hexStringToByteArray(encryptedMessage);
    const keyArray = this.str2ab(key);

    const data = twofish.decrypt(keyArray, encryptedMessageArray);

    const decryptedHex = data
      .map((x: number) => x.toString(16).padStart(2, "0"))
      .join("");

    const decryptedString = new TextDecoder("utf-8").decode(
      new Uint8Array(
        decryptedHex.match(/.{1,2}/g).map((byte: string) => parseInt(byte, 16))
      )
    );

    return decryptedString;
  }
}
