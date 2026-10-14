export const CAFE = {
  id: "lunar-cafe-hyd",
  name: "Lunar Cafe",
  tagline: "A space to pause. A place to connect. Moments that matter.",
  baristaTagline: "Brewed with passion, served with love.",
  addressLines: [
    "Road no 7, Jubilee Hills",
    "Bhavani Nagar, HYD-500045",
  ],
  city: "Hyderabad",
  phone: "081792 28935",
  phoneDisplay: "+91 81792 28935",
  upiId: "lunarcafe@upi",
  gstin: "36ANDPA3116F2ZO",
  hours: "11:00 AM – 11:30 PM",
  hoursStart: "11:00",
  hoursEnd: "23:30",
  mapsQuery: "Lunar Cafe Jubilee Hills Hyderabad",
  zomatoUrl: "https://www.zomato.com",
  swiggyUrl: "https://www.swiggy.com",
  districtUrl: "https://www.district.in",
  colors: {
    mint: "#A8C5B8",
    sage: "#7FA390",
    cream: "#F7F3EB",
    ink: "#1C2421",
    gold: "#C4A35A",
    moon: "#E8F0EC",
  },
} as const;

export const LOCALES = [
  { code: "en", label: "English", name: "English" },
  { code: "hi", label: "हिन्दी", name: "Hindi" },
  { code: "te", label: "తెలుగు", name: "Telugu" },
] as const;

/** Display-only conversion from the base currency (INR). Bills are always charged in ₹. */
export const CURRENCIES = [
  { code: "INR", symbol: "₹", rate: 1, label: "INR", name: "Indian Rupee" },
  { code: "USD", symbol: "$", rate: 0.012, label: "USD", name: "US Dollar" },
  { code: "EUR", symbol: "€", rate: 0.011, label: "EUR", name: "Euro" },
  { code: "GBP", symbol: "£", rate: 0.0094, label: "GBP", name: "British Pound" },
  { code: "AED", symbol: "د.إ", rate: 0.044, label: "AED", name: "UAE Dirham" },
  { code: "AUD", symbol: "A$", rate: 0.018, label: "AUD", name: "Australian Dollar" },
] as const;

export function formatMoney(
  amountInr: number,
  currencyCode: string = "INR",
): string {
  const currency =
    CURRENCIES.find((c) => c.code === currencyCode) ?? CURRENCIES[0];
  const value = amountInr * currency.rate;
  if (currency.code === "INR") {
    return `₹${value.toFixed(2)}`;
  }
  return `${currency.symbol}${value.toFixed(2)}`;
}
