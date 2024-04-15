import CryptoJS from 'crypto-js';

export const encrypt = (text: string): string => {
  return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(text));
};

export const decrypt = (text: string): string => {
  return CryptoJS.enc.Base64.parse(text).toString(CryptoJS.enc.Utf8);
};
