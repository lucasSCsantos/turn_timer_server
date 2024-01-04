import CryptoJS from 'crypto-js';

export const encrypt = (text: string): string => {
  return CryptoJS.AES.encrypt(text, process.env.ENCRYPT_KEY).toString();
};

export const decrypt = (text: string): string => {
  return CryptoJS.AES.decrypt(text, process.env.ENCRYPT_KEY).toString(
    CryptoJS.enc.Utf8
  );
};
