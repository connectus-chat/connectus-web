import * as twf from 'twofish';
import { api } from '../api';
export class SymmetricKeyService {

  generateTwofishKey() {
    const keySize = 32; // 256-bit key
    const key = new Uint8Array(keySize);
    crypto.getRandomValues(key);
    const decoder = new TextDecoder();
    return {
      stringKey: decoder.decode(key), 
      key: key,
    };
  }

  async findSessionKey(id: string, friendId: string){
    const { data } = await api.get<string>(
      `/users/${id}/${friendId}/session-key`
    );
    return data;
  }

  private str2ab(str: string) {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return bufView;
  }

  async encrypt(key: string, message: string) {
    const twofish = twf.twofish();
    const dataArray = this.str2ab(message);
    const keyArray = this.str2ab(key);
    const cipherText = twofish.encrypt(keyArray, dataArray);
    const encryptedString = btoa(String.fromCharCode(...new Uint8Array(cipherText)));
    return encryptedString;
  }

  async decrypt(key: string, encryptedMessage: string) {
    const twofish = twf.twofish();
    const encryptedArrayBuffer = new Uint8Array(atob(encryptedMessage).split('').map(char => char.charCodeAt(0)));

    const keyArray = this.str2ab(key);

    const data = twofish.decrypt(keyArray, encryptedArrayBuffer);
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
