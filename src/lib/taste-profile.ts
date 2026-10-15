/**
 * Delta-style taste profile for flavour pages.
 * Five hoverable keys + a top metric; circles grow on scroll into view.
 */

export type TasteKey = {
  name: string;
  text: string;
  /** shown as n/15 under the description */
  score: number;
};

export type TasteProfile = {
  metricLabel: string;
  metricValue: string;
  /** which key is selected before the first hover */
  defaultIndex: number;
  keys: TasteKey[];
};

export const TASTE_BY_SLUG: Record<string, TasteProfile> = {
  "lunar-lattes": {
    metricLabel: "Caffeine",
    metricValue: "2.10%",
    defaultIndex: 2,
    keys: [
      {
        name: "Balance",
        text: "How the sweet, bitter and acidic notes sit together in the cup.",
        score: 11,
      },
      {
        name: "Acidity",
        text: "A bright, lively lift — citrus and berry sparkle on the tongue.",
        score: 9,
      },
      {
        name: "Intensity",
        text: "The strength of the flavour: from mild and delicate to bold and distinctive.",
        score: 12,
      },
      {
        name: "Body",
        text: "The weight of the sip — light and tea-like, or thick and velvet.",
        score: 10,
      },
      {
        name: "Aroma",
        text: "It may recall flowers, nuts, spices or chocolate when you first smell the cup.",
        score: 13,
      },
    ],
  },
  sandwiches: {
    metricLabel: "Heat",
    metricValue: "Pressed",
    defaultIndex: 1,
    keys: [
      {
        name: "Crunch",
        text: "Butter-brushed bread toasted until the edges crackle with every bite.",
        score: 12,
      },
      {
        name: "Melt",
        text: "Cheese pulled gooey and stretchy straight off the press.",
        score: 13,
      },
      {
        name: "Spice",
        text: "A gentle warmth from house sauces — present, never overpowering.",
        score: 6,
      },
      {
        name: "Richness",
        text: "Buttery toast, melted cheese and sauces layered for a full bite.",
        score: 11,
      },
      {
        name: "Freshness",
        text: "Crisp greens and ripe tomato that keep the sandwich bright.",
        score: 10,
      },
    ],
  },
  mocktails: {
    metricLabel: "Fizz",
    metricValue: "High",
    defaultIndex: 1,
    keys: [
      {
        name: "Sweet",
        text: "Just enough sugar to round the citrus — refreshing, never cloying.",
        score: 8,
      },
      {
        name: "Tang",
        text: "Lime and orange muddled right into the glass for a sharp lift.",
        score: 12,
      },
      {
        name: "Chill",
        text: "Shaken ice-cold so every sip stays bright and sparkling.",
        score: 11,
      },
      {
        name: "Body",
        text: "Light and lively from sparkling soda, never heavy.",
        score: 5,
      },
      {
        name: "Aroma",
        text: "Fresh mint and citrus oils released the moment the glass arrives.",
        score: 10,
      },
    ],
  },
  "wood-fired-pizza": {
    metricLabel: "Oven",
    metricValue: "450°C",
    defaultIndex: 0,
    keys: [
      {
        name: "Crunch",
        text: "Blistered wood-fired crust — charred in spots, airy and chewy inside.",
        score: 13,
      },
      {
        name: "Melt",
        text: "Mozzarella that pulls in long golden strings to the edge.",
        score: 12,
      },
      {
        name: "Spice",
        text: "A slow, warm chilli kick that builds with each slice.",
        score: 8,
      },
      {
        name: "Richness",
        text: "Sauce, cheese and toppings layered for a deep, savoury bite.",
        score: 11,
      },
      {
        name: "Freshness",
        text: "Bright tomato and fresh basil finished just before it leaves the oven.",
        score: 9,
      },
    ],
  },
  "creamy-pasta": {
    metricLabel: "Sauce",
    metricValue: "Silky",
    defaultIndex: 3,
    keys: [
      {
        name: "Bite",
        text: "Pasta cooked al dente — springy chew in every forkful.",
        score: 11,
      },
      {
        name: "Cream",
        text: "Slow-simmered sauce that clings to every ribbon and curl.",
        score: 13,
      },
      {
        name: "Spice",
        text: "From gentle pepper to fiery arrabbiata — heat you can choose.",
        score: 7,
      },
      {
        name: "Richness",
        text: "Cheese, butter and reduced sauces for true comfort.",
        score: 12,
      },
      {
        name: "Herbs",
        text: "Basil and parsley added at the end so they stay bright.",
        score: 9,
      },
    ],
  },
  burgers: {
    metricLabel: "Stack",
    metricValue: "Tall",
    defaultIndex: 0,
    keys: [
      {
        name: "Crunch",
        text: "Toasted bun, fresh lettuce and pickles in every bite.",
        score: 11,
      },
      {
        name: "Juiciness",
        text: "Patties seared hard for a deeply savoury crust and juicy centre.",
        score: 13,
      },
      {
        name: "Spice",
        text: "House sauces with a tangy, smoky kick.",
        score: 7,
      },
      {
        name: "Richness",
        text: "Stacked tall with cheese, sauces and no dainty bites.",
        score: 12,
      },
      {
        name: "Smoke",
        text: "A grilled, charred note from the hot plate.",
        score: 9,
      },
    ],
  },
  "bubble-tea": {
    metricLabel: "Pearls",
    metricValue: "Chewy",
    defaultIndex: 1,
    keys: [
      {
        name: "Sweet",
        text: "Caramel-soft pearls and a gently sweet tea base.",
        score: 10,
      },
      {
        name: "Chew",
        text: "Soft tapioca that bounces with every sip through the wide straw.",
        score: 14,
      },
      {
        name: "Chill",
        text: "Shaken ice-cold until frosty and perfectly smooth.",
        score: 12,
      },
      {
        name: "Body",
        text: "Silky tea with enough weight to carry the pearls.",
        score: 8,
      },
      {
        name: "Fruit",
        text: "Bursts of juice from fruity pops that surprise mid-sip.",
        score: 11,
      },
    ],
  },
  desserts: {
    metricLabel: "Indulgence",
    metricValue: "High",
    defaultIndex: 0,
    keys: [
      {
        name: "Sweet",
        text: "Rich but balanced — never one-note sugar.",
        score: 12,
      },
      {
        name: "Cocoa",
        text: "Dark chocolate that is fudgy and deeply roasted.",
        score: 13,
      },
      {
        name: "Cream",
        text: "Light mascarpone and cream layers that melt on the tongue.",
        score: 11,
      },
      {
        name: "Texture",
        text: "Warm brownie against cold ice cream — contrast in every spoon.",
        score: 14,
      },
      {
        name: "Warmth",
        text: "Fresh-baked heat that meets a chilled finish.",
        score: 10,
      },
    ],
  },
  smoothies: {
    metricLabel: "Fruit",
    metricValue: "100%",
    defaultIndex: 0,
    keys: [
      {
        name: "Sweet",
        text: "Natural sweetness from ripe fruit — no syrups doing the work.",
        score: 10,
      },
      {
        name: "Tang",
        text: "Berry and citrus brightness that keeps each sip lively.",
        score: 9,
      },
      {
        name: "Chill",
        text: "Blended with ice until thick, cold and spoonable.",
        score: 12,
      },
      {
        name: "Body",
        text: "Thick enough to drink slow, never watery.",
        score: 11,
      },
      {
        name: "Freshness",
        text: "Fruit picked and blended on the day, topped with berries or mint.",
        score: 13,
      },
    ],
  },
};

export function getTasteProfile(slug: string): TasteProfile | undefined {
  return TASTE_BY_SLUG[slug];
}
