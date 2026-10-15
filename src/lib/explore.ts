/**
 * "Explore" flavours: the cards on the home page and the themed detail page
 * each one opens (/explore/[slug]). Every flavour carries its own colour theme.
 */

export type ExplorePattern = "diamond" | "dots" | "zigzag" | "waves" | "stripes";

export type ExploreTheme = {
  /** darkest tone, hero panel + headings */
  deep: string;
  /** brand tone, patterns + buttons */
  main: string;
  /** bright tone for highlights on dark */
  light: string;
  /** very light tint, page background below the hero */
  soft: string;
  /** readable text colour when placed on `main` */
  onMain: string;
};

export type Explore = {
  slug: string;
  name: string;
  /** small script label, e.g. "Comfort" */
  note: string;
  img: string;
  /** colour used on the home-page card accents */
  accent: string;
  pattern: ExplorePattern;
  theme: ExploreTheme;
  /** one line under the title */
  kind: string;
  story: string;
  intensity: number;
  intensityLabel: string;
  meta: { label: string; value: string }[];
  notes: { title: string; text: string }[];
  steps: { title: string; text: string }[];
  /** menu categories listed on the page */
  categories: string[];
  gallery: string[];
};

const m = (base: string, n: number) =>
  Array.from({ length: n }, (_, i) =>
    i === 0 ? `/media/menu/${base}.jpg` : `/media/menu/${base}-${i + 1}.jpg`,
  );

export const EXPLORE: Explore[] = [
  {
    slug: "sandwiches",
    name: "Sandwiches",
    note: "Grilled",
    img: "/media/menu/sandwich-2.jpg",
    accent: "#b5532a",
    pattern: "stripes",
    theme: { deep: "#3f1a0b", main: "#b5532a", light: "#ff9d73", soft: "#faeee6", onMain: "#ffffff" },
    kind: "Pressed to order, golden & gooey",
    story:
      "Thick-cut bread toasted until the edges crackle, stacked with crisp greens, melting cheese and sauces we make in-house. Every sandwich is pressed to order, so the first bite is always warm, golden and a little bit gooey.",
    intensity: 6,
    intensityLabel: "Hearty",
    meta: [
      { label: "Serves", value: "1" },
      { label: "Prep", value: "10 min" },
      { label: "Pairs with", value: "Cold brew" },
    ],
    notes: [
      { title: "Toasted crunch", text: "Butter-brushed bread with a crisp, golden edge." },
      { title: "Melted cheese", text: "Pulled gooey and stretchy straight off the press." },
      { title: "Fresh greens", text: "Crisp leaves and ripe tomato for a bright bite." },
      { title: "House sauce", text: "Creamy, tangy and just a little smoky." },
    ],
    steps: [
      { title: "Toast", text: "Bread is brushed and toasted on the flat grill." },
      { title: "Stack", text: "Cheese, greens and fillings layered by hand." },
      { title: "Press", text: "Pressed until the cheese melts and the crust sets." },
      { title: "Slice", text: "Cut on the diagonal and served piping hot." },
    ],
    categories: ["Sandwiches", "Breakfast Omelettes"],
    gallery: m("sandwich", 3),
  },
  {
    slug: "lunar-lattes",
    name: "Lunar Lattes",
    note: "Coffee",
    img: "/media/menu/coffee-2.jpg",
    accent: "#1f8b4a",
    pattern: "diamond",
    theme: { deep: "#093520", main: "#1f8b4a", light: "#7be0a2", soft: "#e8f5ec", onMain: "#ffffff" },
    kind: "Slow-pulled espresso, velvet milk",
    story:
      "Our baristas pull every shot slow and steam the milk to velvet, then finish it with the cafe's moon-dust touch. From a classic cappuccino to the glowing Lunar Sky Latte, each cup is made for lingering.",
    intensity: 8,
    intensityLabel: "Bold",
    meta: [
      { label: "Serves", value: "1" },
      { label: "Prep", value: "5 min" },
      { label: "Pairs with", value: "Tiramisu jar" },
    ],
    notes: [
      { title: "Dark cocoa", text: "Deep roasted notes that linger on the finish." },
      { title: "Toasted nuts", text: "A gentle, warm sweetness from the roast." },
      { title: "Caramel", text: "Rounded off with a soft caramelised edge." },
      { title: "Velvet milk", text: "Steamed to a glossy, silky microfoam." },
    ],
    steps: [
      { title: "Grind", text: "Beans ground fresh for every single shot." },
      { title: "Pull", text: "A slow, even extraction for a rich crema." },
      { title: "Steam", text: "Milk steamed until it turns glossy and sweet." },
      { title: "Pour", text: "Finished with latte art and the moon-dust touch." },
    ],
    categories: ["Hot Coffees", "Cold Brews", "Ice Lattes", "Frappuccino"],
    gallery: m("coffee", 4),
  },
  {
    slug: "mocktails",
    name: "Mocktails",
    note: "Refreshers",
    img: "/media/menu/mocktail-2.jpg",
    accent: "#d9661f",
    pattern: "dots",
    theme: { deep: "#4f1f05", main: "#d9661f", light: "#ffb37d", soft: "#fdeee1", onMain: "#ffffff" },
    kind: "Muddled, shaken & sparkling",
    story:
      "Mojitos and coolers built from fresh mint, crushed citrus and just enough sweetness, topped with sparkling soda. Zero alcohol, all of the celebration.",
    intensity: 5,
    intensityLabel: "Zesty",
    meta: [
      { label: "Serves", value: "1" },
      { label: "Prep", value: "4 min" },
      { label: "Pairs with", value: "Wood-fired pizza" },
    ],
    notes: [
      { title: "Fresh mint", text: "Bruised just enough to release its cool aroma." },
      { title: "Citrus zing", text: "Lime and orange muddled right into the glass." },
      { title: "Sparkling soda", text: "A lively fizz that keeps every sip light." },
      { title: "Sweet & sour", text: "Balanced so it is refreshing, never cloying." },
    ],
    steps: [
      { title: "Muddle", text: "Mint and citrus pressed to release their oils." },
      { title: "Shake", text: "Shaken hard with ice until ice-cold." },
      { title: "Top up", text: "Finished with chilled sparkling soda." },
      { title: "Garnish", text: "A mint crown and a citrus wheel to serve." },
    ],
    categories: ["Mocktails", "Mojitos", "Fresh Lime Soda"],
    gallery: m("mocktail", 4),
  },
  {
    slug: "wood-fired-pizza",
    name: "Wood-fired Pizza",
    note: "Fusion",
    img: "/media/menu/pizza-2.jpg",
    accent: "#f0a800",
    pattern: "zigzag",
    theme: { deep: "#4a3000", main: "#f0a800", light: "#ffd666", soft: "#fff5d6", onMain: "#2c1d00" },
    kind: "Blistered crust, fusion toppings",
    story:
      "Hand-stretched dough, a blistered wood-fired crust and cheese pulled right to the edge. Classic Margherita through to fusion toppings that would never show up in Naples.",
    intensity: 7,
    intensityLabel: "Rich",
    meta: [
      { label: "Serves", value: "2" },
      { label: "Prep", value: "15 min" },
      { label: "Pairs with", value: "Mocktails" },
    ],
    notes: [
      { title: "Blistered crust", text: "Charred in spots, airy and chewy inside." },
      { title: "Stretchy cheese", text: "Mozzarella that pulls in long golden strings." },
      { title: "Basil & tomato", text: "Bright sauce with fresh basil on top." },
      { title: "Chilli kick", text: "A slow, warm heat that builds with each slice." },
    ],
    steps: [
      { title: "Stretch", text: "Dough stretched by hand, never rolled." },
      { title: "Dress", text: "Sauce, cheese and toppings added in order." },
      { title: "Fire", text: "Baked in the wood-fired oven in minutes." },
      { title: "Slice", text: "Cut and served bubbling hot at your table." },
    ],
    categories: ["Pizzas"],
    gallery: m("pizza", 4),
  },
  {
    slug: "creamy-pasta",
    name: "Creamy Pasta",
    note: "Comfort",
    img: "/media/menu/pasta-2.jpg",
    accent: "#e8e3cf",
    pattern: "waves",
    theme: { deep: "#40351b", main: "#d8c58a", light: "#f3e4b0", soft: "#faf5e4", onMain: "#33290f" },
    kind: "Al dente, slow-simmered sauces",
    story:
      "Pasta cooked al dente and folded through slow-simmered sauces: creamy white, fiery arrabbiata or bright basil pesto. Finished with cheese and a twist of pepper.",
    intensity: 6,
    intensityLabel: "Comforting",
    meta: [
      { label: "Serves", value: "1" },
      { label: "Prep", value: "12 min" },
      { label: "Pairs with", value: "Fresh lime soda" },
    ],
    notes: [
      { title: "Al dente bite", text: "Cooked to a perfect, springy chew." },
      { title: "Silky sauce", text: "Clings to every ribbon and curl." },
      { title: "Fresh herbs", text: "Basil and parsley added at the very end." },
      { title: "Parmesan", text: "Nutty, salty and generously grated." },
    ],
    steps: [
      { title: "Boil", text: "Pasta cooked in well-salted, rolling water." },
      { title: "Simmer", text: "Sauce reduced slowly until glossy." },
      { title: "Toss", text: "Pasta finished in the pan with the sauce." },
      { title: "Finish", text: "Cheese, herbs and pepper just before serving." },
    ],
    categories: ["Pastas", "Chef's Pasta"],
    gallery: m("pasta", 3),
  },
  {
    slug: "burgers",
    name: "Burgers",
    note: "Stacked",
    img: "/media/menu/burger-2.jpg",
    accent: "#c9a58f",
    pattern: "diamond",
    theme: { deep: "#3a2216", main: "#b97a54", light: "#e8b592", soft: "#f8ece4", onMain: "#ffffff" },
    kind: "Stacked tall, no dainty bites",
    story:
      "Juicy patties, toasted buns and sauces made in-house, stacked tall and served with crisp fries. Pick them up with both hands.",
    intensity: 7,
    intensityLabel: "Loaded",
    meta: [
      { label: "Serves", value: "1" },
      { label: "Prep", value: "12 min" },
      { label: "Pairs with", value: "Milkshake" },
    ],
    notes: [
      { title: "Juicy patty", text: "Seared hard for a deeply savoury crust." },
      { title: "Toasted bun", text: "Soft inside, golden and buttery outside." },
      { title: "Crisp crunch", text: "Fresh lettuce, onion and pickles in every bite." },
      { title: "Secret sauce", text: "Tangy, creamy and a little smoky." },
    ],
    steps: [
      { title: "Sear", text: "Patties pressed and seared on a hot plate." },
      { title: "Toast", text: "Buns buttered and toasted until golden." },
      { title: "Stack", text: "Built layer by layer so nothing slides." },
      { title: "Serve", text: "Pinned, plated and sent out with fries." },
    ],
    categories: ["Burgers"],
    gallery: m("burger", 3),
  },
  {
    slug: "bubble-tea",
    name: "Bubble Tea",
    note: "Chilled",
    img: "/media/menu/tea-2.jpg",
    accent: "#0f5a52",
    pattern: "waves",
    theme: { deep: "#042622", main: "#14907f", light: "#6fe0cc", soft: "#e0f4f0", onMain: "#ffffff" },
    kind: "Silky tea, chewy pearls",
    story:
      "Silky teas shaken ice-cold with chewy tapioca pearls and fruity pops. Sweet, bouncy and impossible to sip just once.",
    intensity: 4,
    intensityLabel: "Playful",
    meta: [
      { label: "Serves", value: "1" },
      { label: "Prep", value: "6 min" },
      { label: "Pairs with", value: "Brownie" },
    ],
    notes: [
      { title: "Brewed tea", text: "A clean, fragrant base brewed fresh each day." },
      { title: "Chewy pearls", text: "Soft, caramel-sweet tapioca at the bottom." },
      { title: "Fruity pops", text: "Bursts of juice that surprise with every sip." },
      { title: "Ice-cold", text: "Shaken until frosty and perfectly smooth." },
    ],
    steps: [
      { title: "Brew", text: "Tea steeped strong, then chilled." },
      { title: "Cook", text: "Pearls simmered until soft and chewy." },
      { title: "Shake", text: "Everything shaken hard over ice." },
      { title: "Sip", text: "Poured with a wide straw for the pearls." },
    ],
    categories: ["Bubble Tea", "Green Teas", "Ice Tea", "Hot Teas"],
    gallery: m("tea", 3),
  },
  {
    slug: "desserts",
    name: "Desserts",
    note: "Sweet",
    img: "/media/menu/dessert-2.jpg",
    accent: "#c2386f",
    pattern: "dots",
    theme: { deep: "#45102a", main: "#c2386f", light: "#ff94c0", soft: "#fce8f1", onMain: "#ffffff" },
    kind: "Baked, chilled & indulgent",
    story:
      "Warm brownies, tiramisu jars and pastries baked for the sweet tooth. Save room, because the best part of dinner is the last spoonful.",
    intensity: 9,
    intensityLabel: "Indulgent",
    meta: [
      { label: "Serves", value: "1-2" },
      { label: "Prep", value: "5 min" },
      { label: "Pairs with", value: "Lunar latte" },
    ],
    notes: [
      { title: "Dark chocolate", text: "Rich, fudgy and not too sweet." },
      { title: "Cream & mascarpone", text: "Light, airy layers that melt on the tongue." },
      { title: "Fresh fruit", text: "A bright, tart finish to cut the richness." },
      { title: "Warm & cold", text: "Hot brownie, cold ice cream, perfect contrast." },
    ],
    steps: [
      { title: "Bake", text: "Brownies and pastries baked fresh each day." },
      { title: "Layer", text: "Jars built with cream, cocoa and coffee." },
      { title: "Chill", text: "Rested so every flavour comes together." },
      { title: "Finish", text: "Sauce, cocoa and a scoop to serve." },
    ],
    categories: ["Desserts", "Milkshakes"],
    gallery: m("dessert", 4),
  },
  {
    slug: "smoothies",
    name: "Smoothies",
    note: "Fresh",
    img: "/media/menu/smoothie-2.jpg",
    accent: "#5b8f2e",
    pattern: "zigzag",
    theme: { deep: "#213a0d", main: "#5b8f2e", light: "#b6e877", soft: "#eaf4dc", onMain: "#ffffff" },
    kind: "Thick, fruity & made to order",
    story:
      "Thick, fruity blends made fresh to order with real fruit and nothing from a carton. Bright, cold and genuinely good for you.",
    intensity: 3,
    intensityLabel: "Light",
    meta: [
      { label: "Serves", value: "1" },
      { label: "Prep", value: "4 min" },
      { label: "Pairs with", value: "Sandwiches" },
    ],
    notes: [
      { title: "Ripe fruit", text: "Berries and mango chosen at their sweetest." },
      { title: "Thick & cold", text: "Blended with ice for a spoonable texture." },
      { title: "Natural sweetness", text: "No syrups, just fruit doing the work." },
      { title: "Fresh finish", text: "Topped with berries or mint to serve." },
    ],
    steps: [
      { title: "Select", text: "Fruit picked and prepped on the day." },
      { title: "Blend", text: "Whizzed with ice until smooth." },
      { title: "Taste", text: "Balanced by hand for sweetness." },
      { title: "Top", text: "A berry or mint garnish to finish." },
    ],
    categories: ["Smoothies", "Fresh Juices", "Milkshakes"],
    gallery: m("smoothie", 3),
  },
];

export function getExplore(slug: string): Explore | undefined {
  return EXPLORE.find((e) => e.slug === slug);
}

/* ------------------------------------------------------------------
   Dish pages (/menu/[dish]) borrow the theme of the flavour their
   category belongs to; curries & breads get their own spice theme.
   ------------------------------------------------------------------ */

const CATEGORY_FLAVOUR: Record<string, string> = {
  "Hot Coffees": "lunar-lattes",
  "Cold Brews": "lunar-lattes",
  "Ice Lattes": "lunar-lattes",
  Frappuccino: "lunar-lattes",
  "Frappe Icecream Blended": "lunar-lattes",
  Mocktails: "mocktails",
  Mojitos: "mocktails",
  "Fresh Lime Soda": "mocktails",
  Extras: "mocktails",
  Pizzas: "wood-fired-pizza",
  Pastas: "creamy-pasta",
  "Chef's Pasta": "creamy-pasta",
  Bowls: "creamy-pasta",
  Mains: "creamy-pasta",
  Burgers: "burgers",
  Appetizers: "burgers",
  "Veg Starters": "burgers",
  "Non-Veg Starters": "burgers",
  Sandwiches: "sandwiches",
  "Breakfast Omelettes": "sandwiches",
  Soups: "sandwiches",
  "Bubble Tea": "bubble-tea",
  "Green Teas": "bubble-tea",
  "Hot Teas": "bubble-tea",
  "Ice Tea": "bubble-tea",
  Desserts: "desserts",
  Milkshakes: "desserts",
  Smoothies: "smoothies",
  "Fresh Juices": "smoothies",
  Salads: "smoothies",
};

const SPICE_THEME: ExploreTheme = {
  deep: "#4a1408",
  main: "#cf4a1c",
  light: "#ff9a6b",
  soft: "#fbebe4",
  onMain: "#ffffff",
};

export function themeForCategory(category: string): {
  flavour?: Explore;
  theme: ExploreTheme;
  pattern: ExplorePattern;
} {
  const slug = CATEGORY_FLAVOUR[category];
  const flavour = slug ? getExplore(slug) : undefined;
  if (flavour) return { flavour, theme: flavour.theme, pattern: flavour.pattern };
  return { theme: SPICE_THEME, pattern: "diamond" };
}
