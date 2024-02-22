import { AsymmetricKeyService } from "./asymmetric_key_service";

export class ClientEncryptService {
    constructor(private readonly keyService: AsymmetricKeyService) {}
    async generateClientKey(){
        const keys = await this.keyService.generateRSAKeyPair();
        localStorage.setItem('pub-general-key', keys.publicKey);
        localStorage.setItem('priv-general-key', keys.privateKey);
    }  
}