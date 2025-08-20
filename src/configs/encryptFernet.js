import * as Fernet from "@crmackey/fernet";
import { config } from "./encrypt.config";

export function encryptPayload(payload) {
  if (!config.encryption.enabled) {
    return JSON.stringify(payload);
  }

  try {
    const secret = new Fernet.Secret(config.encryption.secret);
    const token = new Fernet.Token({
      secret: secret,
      time: Date.now().toString(),
      iv: undefined,
    });

    const json = JSON.stringify(payload);
    const encrypted = token.encode(json);
    const base64Encrypted = btoa(encrypted);

    if (config.encryption.doubleEncode) {
      return btoa(base64Encrypted);
    }

    return base64Encrypted;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt payload: " + error.message);
  }
}

export function decryptPayload(encryptedData) {
  if (!config.encryption.enabled) {
    return JSON.parse(encryptedData);
  }

  try {
    const secret = new Fernet.Secret(config.encryption.secret);
    let dataToProcess = encryptedData;

    if (config.encryption.doubleEncode) {
      dataToProcess = atob(dataToProcess);
    }

    const fernetToken = atob(dataToProcess);

    const token = new Fernet.Token({
      secret: secret,
      token: fernetToken,
    });

    const decrypted = token.decode();
    return JSON.parse(decrypted);
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt payload: " + error.message);
  }
}
