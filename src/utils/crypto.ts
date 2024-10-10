import CryptoJS from 'crypto-js';

export const encrypt = (text: string): string => {
  return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(text));
};

export const decrypt = (text: string): string => {
  return CryptoJS.enc.Base64.parse(text).toString(CryptoJS.enc.Utf8);
};

export const generateUniqueCode = (text: string): string => {
  return CryptoJS.SHA256(`${text}${new Date().toUTCString()}`)
    .toString(CryptoJS.enc.Hex)
    .substring(0, 5)
    .toUpperCase();
};
