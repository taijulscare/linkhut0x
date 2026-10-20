/**
 * Safe Title Formatter for Telegram startParam
 */
export const formatTitle = (param?: string | null): string => {
  if (!param || typeof param !== 'string') return '';

  let text = param.trim();
  let hasExtraCode = false;

  // ১. শেষের র‍্যান্ডম কোড/আইডি রিমুভ করা (যেমন: 7234x, -16s, se1)
  const cleanedText = text.replace(/([-_]?[a-zA-Z]*\d+[a-zA-Z0-9]*)$/, '');

  if (cleanedText !== text) {
    text = cleanedText;
    hasExtraCode = true;
  }

  // ২. হাইফেন/আন্ডারস্কোর সরিয়ে স্পেস দেওয়া এবং Capitalize করা
  const formatted = text
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return hasExtraCode ? `${formatted}...` : formatted;
};
