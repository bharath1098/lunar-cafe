/** India mobile: drop +91 / leading 0 and keep a 10-digit number starting 6–9. */
export function indianMobile(input: string): string | null {
  let digits = String(input || "").replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length > 10) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  if (digits.length > 10) digits = digits.slice(-10);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}
