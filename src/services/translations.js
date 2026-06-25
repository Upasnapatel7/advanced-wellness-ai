// Language detection and management
export const getBrowserLanguage = () => {
  const browserLang = navigator.language || navigator.userLanguage;
  return browserLang.startsWith('hi') ? 'hi' : 'en';
};

export const setLanguage = (lang) => {
  localStorage.setItem('preferredLanguage', lang);
};

export const getCurrentLanguage = () => {
  return localStorage.getItem('preferredLanguage') || getBrowserLanguage();
};