/**
 * Configuration Service
 * This service provides methods to inject product configuration into i18n files
 */

import PRODUCT_CONFIG from "@/config/product";

/**
 * Replace product placeholders in content
 * @param content - The content containing placeholders
 * @param locale - The locale (en or zh)
 * @returns Content with replaced placeholders
 */
export function replaceProductPlaceholders(content: any, locale: string = "en"): any {
  const isZh = locale === "zh";
  
  // Define replacement map
  const replacements = {
    "{{PRODUCT_NAME}}": isZh ? PRODUCT_CONFIG.nameZh : PRODUCT_CONFIG.name,
    "{{PRODUCT_SHORT_NAME}}": isZh ? PRODUCT_CONFIG.shortNameZh : PRODUCT_CONFIG.shortName,
    "{{PRODUCT_DESCRIPTION}}": isZh ? PRODUCT_CONFIG.descriptionZh : PRODUCT_CONFIG.description,
    "{{COMPANY_NAME}}": isZh ? PRODUCT_CONFIG.companyZh : PRODUCT_CONFIG.company,
    "{{DOMAIN}}": PRODUCT_CONFIG.domain,
    "{{WEBSITE_URL}}": PRODUCT_CONFIG.urls.website,
    "{{DOCS_URL}}": PRODUCT_CONFIG.urls.docs,
    "{{API_URL}}": PRODUCT_CONFIG.urls.api,
    "{{GITHUB_URL}}": PRODUCT_CONFIG.urls.github,
    "{{TWITTER_URL}}": PRODUCT_CONFIG.urls.twitter,
    "{{DISCORD_URL}}": PRODUCT_CONFIG.urls.discord,
    "{{SUPPORT_EMAIL}}": PRODUCT_CONFIG.urls.support,
    "{{COPYRIGHT}}": isZh ? PRODUCT_CONFIG.copyright.zh : PRODUCT_CONFIG.copyright.en,
    "{{TAGLINE}}": isZh ? PRODUCT_CONFIG.tagline.zh : PRODUCT_CONFIG.tagline.en,
    "{{BADGE}}": isZh ? PRODUCT_CONFIG.badge.zh : PRODUCT_CONFIG.badge.en,
  };
  
  // Recursively replace placeholders
  function replaceInObject(obj: any): any {
    if (typeof obj === "string") {
      let result = obj;
      for (const [placeholder, value] of Object.entries(replacements)) {
        result = result.replace(new RegExp(placeholder, "g"), value);
      }
      return result;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => replaceInObject(item));
    }
    
    if (obj !== null && typeof obj === "object") {
      const newObj: any = {};
      for (const [key, value] of Object.entries(obj)) {
        newObj[key] = replaceInObject(value);
      }
      return newObj;
    }
    
    return obj;
  }
  
  return replaceInObject(content);
}

/**
 * Get product configuration for a specific locale
 * @param locale - The locale (en or zh)
 * @returns Localized product configuration
 */
export function getProductConfig(locale: string = "en") {
  const isZh = locale === "zh";
  
  return {
    name: isZh ? PRODUCT_CONFIG.nameZh : PRODUCT_CONFIG.name,
    shortName: isZh ? PRODUCT_CONFIG.shortNameZh : PRODUCT_CONFIG.shortName,
    description: isZh ? PRODUCT_CONFIG.descriptionZh : PRODUCT_CONFIG.description,
    company: isZh ? PRODUCT_CONFIG.companyZh : PRODUCT_CONFIG.company,
    copyright: isZh ? PRODUCT_CONFIG.copyright.zh : PRODUCT_CONFIG.copyright.en,
    tagline: isZh ? PRODUCT_CONFIG.tagline.zh : PRODUCT_CONFIG.tagline.en,
    badge: isZh ? PRODUCT_CONFIG.badge.zh : PRODUCT_CONFIG.badge.en,
    ...PRODUCT_CONFIG.urls,
  };
}