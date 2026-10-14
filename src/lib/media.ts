/** Local cafe + menu imagery under /public/media */

export const CAFE_MEDIA = {
  hero: "/media/cafe/patio.webp",
  heroAlt: "/media/cafe/floral-arch.webp",
  logoMug: "/media/cafe/latte-mug.webp",
  signature: "/media/cafe/chicken-tikka.webp",
  interior: "/media/cafe/interior.jpg",
  espresso: "/media/cafe/espresso-bar.jpg",
  pastries: "/media/cafe/pastry-counter.jpg",
  drinks: "/media/cafe/layered-drinks.jpg",
  wings: "/media/cafe/wings.jpg",
  nightSign: "/media/cafe/night-sign.webp",
  goldSign: "/media/cafe/gold-sign.webp",
  arch: "/media/cafe/floral-arch.webp",
  patio: "/media/cafe/patio.webp",
} as const;

export const GALLERY = [
  { src: CAFE_MEDIA.patio, title: "Garden patio" },
  { src: CAFE_MEDIA.arch, title: "Floral arch nights" },
  { src: CAFE_MEDIA.interior, title: "Dining room" },
  { src: CAFE_MEDIA.espresso, title: "Barista bar" },
  { src: CAFE_MEDIA.pastries, title: "Pastry counter" },
  { src: CAFE_MEDIA.logoMug, title: "Lunar latte" },
  { src: CAFE_MEDIA.signature, title: "Chipotle chicken tikka" },
  { src: CAFE_MEDIA.wings, title: "Wings plate" },
  { src: CAFE_MEDIA.drinks, title: "Layered cold brew" },
  { src: CAFE_MEDIA.nightSign, title: "Night sign" },
  { src: CAFE_MEDIA.goldSign, title: "Entrance sign" },
] as const;

const m = (base: string, n: number) =>
  Array.from({ length: n }, (_, i) =>
    i === 0 ? `/media/menu/${base}.jpg` : `/media/menu/${base}-${i + 1}.jpg`,
  );

const POOLS = {
  coffee: m("coffee", 4),
  tea: m("tea", 3),
  pizza: m("pizza", 4),
  pasta: m("pasta", 3),
  burger: m("burger", 3),
  salad: m("salad", 3),
  dessert: m("dessert", 4),
  mocktail: m("mocktail", 4),
  smoothie: m("smoothie", 3),
  curry: m("curry", 3),
  chicken: m("chicken", 3),
  fries: m("fries", 3),
  omelette: m("omelette", 3),
  soup: m("soup", 3),
  noodles: m("noodles", 3),
  sandwich: m("sandwich", 3),
  juice: m("juice", 3),
  naan: ["/media/menu/naan.jpg"],
} as const;

const CATEGORY_POOL: Record<string, readonly string[]> = {
  "Breakfast Omelettes": POOLS.omelette,
  Soups: POOLS.soup,
  Salads: POOLS.salad,
  Appetizers: POOLS.fries,
  "Veg Starters": POOLS.salad,
  "Non-Veg Starters": POOLS.chicken,
  Burgers: POOLS.burger,
  Sandwiches: POOLS.sandwich,
  Pastas: POOLS.pasta,
  "Chef's Pasta": POOLS.pasta,
  Bowls: POOLS.noodles,
  "Indian Curries": POOLS.curry,
  Pizzas: POOLS.pizza,
  Mains: POOLS.chicken,
  "Indian Breads": POOLS.naan,
  Desserts: POOLS.dessert,
  "Hot Coffees": POOLS.coffee,
  "Hot Teas": POOLS.tea,
  "Green Teas": POOLS.tea,
  "Frappe Icecream Blended": POOLS.coffee,
  Frappuccino: POOLS.coffee,
  "Ice Lattes": POOLS.coffee,
  "Ice Tea": POOLS.tea,
  Milkshakes: POOLS.smoothie,
  Smoothies: POOLS.smoothie,
  Mocktails: POOLS.mocktail,
  Mojitos: POOLS.mocktail,
  "Fresh Lime Soda": POOLS.juice,
  "Fresh Juices": POOLS.juice,
  "Cold Brews": POOLS.coffee,
  "Bubble Tea": POOLS.smoothie,
  Extras: POOLS.juice,
};

/** Your own photos win where they match the dish. */
const NAME_OVERRIDES: Record<string, string> = {
  "Chipotle Chicken Tikka": CAFE_MEDIA.signature,
  "Masala Chicken Wings": CAFE_MEDIA.wings,
  "Chicken Wings With Peri-Peri Dust": CAFE_MEDIA.wings,
  "Lunar Sky Latte": CAFE_MEDIA.logoMug,
  "Lunar Black Beauty": CAFE_MEDIA.logoMug,
  "Cappuccino": CAFE_MEDIA.logoMug,
  "Refresh Coffee": CAFE_MEDIA.drinks,
  "Passion Fruit Cold Brew": CAFE_MEDIA.drinks,
  "Milk Caramel Cold Brew": CAFE_MEDIA.drinks,
  "Classic Cold Brew": CAFE_MEDIA.drinks,
  "Hibiscus Mint": CAFE_MEDIA.drinks,
  "Brownie with Ice Cream": CAFE_MEDIA.pastries,
  "Tiramisu Jar": CAFE_MEDIA.pastries,
};

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function imageForMenuItem(name: string, category: string): string {
  if (NAME_OVERRIDES[name]) return NAME_OVERRIDES[name];
  const pool = CATEGORY_POOL[category] || POOLS.coffee;
  return pool[hash(name) % pool.length];
}
