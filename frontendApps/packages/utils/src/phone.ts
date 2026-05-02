const INDIA_CODE = '+91';
const INDIA_MOBILE_REGEX = /^[6-9]\d{9}$/;

export function isValidIndianMobile(digits: string): boolean {
  return INDIA_MOBILE_REGEX.test(digits.replace(/\s/g, ''));
}

export function toE164(digits: string, countryCode = INDIA_CODE): string {
  const cleaned = digits.replace(/\D/g, '');
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+${cleaned}`;
  }
  return `${countryCode}${cleaned}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '****';
  return `${'*'.repeat(digits.length - 4)}${digits.slice(-4)}`;
}

export function lastFourDigits(phone: string): string {
  return phone.replace(/\D/g, '').slice(-4);
}
