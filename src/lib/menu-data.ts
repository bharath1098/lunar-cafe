import type { MenuItem } from "./types";

let _id = 1;
const id = () => `mi-${_id++}`;

function item(
  partial: Omit<MenuItem, "id" | "available"> & { available?: boolean },
): MenuItem {
  return { available: true, ...partial, id: id() };
}

const vegChicken = (veg: number, chicken: number) => [
  { id: "veg", label: "Veg", price: veg },
  { id: "chicken", label: "Chicken", price: chicken },
];

const vegChickenPrawns = (veg: number, chicken: number, prawns: number) => [
  { id: "veg", label: "Veg", price: veg },
  { id: "chicken", label: "Chicken", price: chicken },
  { id: "prawns", label: "Prawns", price: prawns },
];

const vegEggChickenPrawns = (
  veg: number,
  egg: number,
  chicken: number,
  prawns: number,
) => [
  { id: "veg", label: "Veg", price: veg },
  { id: "egg", label: "Egg", price: egg },
  { id: "chicken", label: "Chicken", price: chicken },
  { id: "prawns", label: "Prawns", price: prawns },
];

export const SEED_MENU: MenuItem[] = [
  // Breakfast
  item({
    category: "Breakfast Omelettes",
    name: "Plain Omelette",
    description: "Served with toast, parsley butter & potato wedges",
    price: 220,
    isVeg: true,
  }),
  item({
    category: "Breakfast Omelettes",
    name: "Masala Omelette",
    description: "Served with toast, parsley butter & potato wedges",
    price: 230,
    isVeg: true,
  }),
  item({
    category: "Breakfast Omelettes",
    name: "Cheese Omelette",
    description: "Served with toast, parsley butter & potato wedges",
    price: 240,
    isVeg: true,
  }),
  item({
    category: "Breakfast Omelettes",
    name: "Spinach & Mushroom Feta",
    description: "Served with toast, parsley butter & potato wedges",
    price: 260,
    isVeg: true,
    isHighlighted: true,
  }),
  item({
    category: "Breakfast Omelettes",
    name: "Fried Egg",
    description: "Served with toast, parsley butter & potato wedges",
    price: 220,
    isVeg: true,
  }),
  item({
    category: "Breakfast Omelettes",
    name: "Sunny Side",
    description: "Served with toast, parsley butter & potato wedges",
    price: 220,
    isVeg: true,
  }),
  item({
    category: "Breakfast Omelettes",
    name: "Poached",
    description: "Served with toast, parsley butter & potato wedges",
    price: 220,
    isVeg: true,
  }),
  item({
    category: "Breakfast Omelettes",
    name: "Boiled",
    description: "Served with toast, parsley butter & potato wedges",
    price: 240,
    isVeg: true,
  }),
  item({
    category: "Breakfast Omelettes",
    name: "Bread Omelette",
    description: "Served with toast, parsley butter & potato wedges",
    price: 220,
    isVeg: true,
  }),
  item({
    category: "Breakfast Omelettes",
    name: "Scrambled",
    description: "Served with toast, parsley butter & potato wedges",
    price: 220,
    isVeg: true,
  }),

  // Soups
  item({
    category: "Soups",
    name: "Creamy Hungarian Mushroom Soup",
    description:
      "Rich and earthy soup with mushroom, sweet paprika and sour cream",
    price: 340,
    isVeg: true,
  }),
  item({
    category: "Soups",
    name: "Manchow Soup",
    description: "Spicy Indo-Chinese soup with soya and aromatic spices",
    price: 290,
    variants: vegChicken(290, 360),
  }),
  item({
    category: "Soups",
    name: "Peruvian Chicken Soup",
    description:
      "Hearty chicken, potatoes, vegetables in cilantro-infused broth",
    price: 360,
    isVeg: false,
  }),

  // Salads
  item({
    category: "Salads",
    name: "Classic Caesar Salad",
    description:
      "Iceberg lettuce, creamy caesar, garlic, anchovy, parmesan, croutons",
    price: 370,
    variants: vegChicken(370, 410),
  }),
  item({
    category: "Salads",
    name: "Sprouts Salad",
    description: "Crunchy nutrient-dense germinated legumes",
    price: 370,
    isVeg: true,
  }),

  // Appetizers
  item({
    category: "Appetizers",
    name: "Classic Fries",
    description: "Crispy golden fries",
    price: 300,
    isVeg: true,
  }),
  item({
    category: "Appetizers",
    name: "Peri-Peri Fries",
    description: "Fries with peri-peri seasoning",
    price: 320,
    isVeg: true,
  }),
  item({
    category: "Appetizers",
    name: "Cheese Loaded Fries",
    description: "Fries topped with cheese",
    price: 340,
    isVeg: true,
  }),
  item({
    category: "Appetizers",
    name: "Cajun Spicy Potato Wedges",
    description: "Cajun spiced wedges",
    price: 280,
    isVeg: true,
  }),
  item({
    category: "Appetizers",
    name: "Plain Garlic Bread",
    description: "Toasted garlic bread",
    price: 220,
    isVeg: true,
  }),
  item({
    category: "Appetizers",
    name: "Cheese Chilli Garlic Bread",
    description: "Garlic bread with cheese and chilli",
    price: 280,
    isVeg: true,
  }),
  item({
    category: "Appetizers",
    name: "Peri-Peri Onion Rings",
    description: "Crispy onion rings",
    price: 280,
    isVeg: true,
  }),
  item({
    category: "Appetizers",
    name: "Malai Chicken Cheese Crostini",
    description: "Malai chicken on cheese crostini",
    price: 380,
  }),
  item({
    category: "Appetizers",
    name: "Paneer Popcorn",
    description: "Crispy paneer popcorn",
    price: 360,
    isVeg: true,
  }),
  item({
    category: "Appetizers",
    name: "Chicken Popcorn",
    description: "Crispy chicken popcorn",
    price: 380,
  }),
  item({
    category: "Appetizers",
    name: "Kasundi Fish Fingers",
    description: "Fish fingers with kasundi",
    price: 420,
  }),
  item({
    category: "Appetizers",
    name: "Masala Chicken Wings",
    description: "Spiced chicken wings",
    price: 380,
  }),
  item({
    category: "Appetizers",
    name: "Chicken Wings With Peri-Peri Dust",
    description: "Wings with peri-peri dust",
    price: 380,
  }),
  item({
    category: "Appetizers",
    name: "Street Style Pepper Chicken",
    description: "Pepper chicken street style",
    price: 380,
  }),

  // Veg starters
  item({
    category: "Veg Starters",
    name: "Classic Hummus With Mini Grilled Pita",
    description: "Hummus with grilled pita, pickled cucumber and carrot",
    price: 380,
    isVeg: true,
  }),
  item({
    category: "Veg Starters",
    name: "Mongolian Chilli Paneer",
    description: "Crispy paneer in spicy tangy sauce",
    price: 380,
    isVeg: true,
  }),
  item({
    category: "Veg Starters",
    name: "Honey Chilly Lotus Stems",
    description: "Crunchy lotus stems with zing",
    price: 380,
    isVeg: true,
  }),
  item({
    category: "Veg Starters",
    name: "Salt N Pepper Mushroom",
    description: "Warm spicy mushroom starter",
    price: 380,
    isVeg: true,
  }),
  item({
    category: "Veg Starters",
    name: "Cajun Spicy Paneer Tikka",
    description: "Fusion paneer tikka",
    price: 380,
    isVeg: true,
  }),
  item({
    category: "Veg Starters",
    name: "Malai Cheese Broccoli",
    description: "Rich malai broccoli",
    price: 380,
    isVeg: true,
  }),
  item({
    category: "Veg Starters",
    name: "Crispy Corn",
    description: "Crunchy corn snack",
    price: 380,
    isVeg: true,
  }),
  item({
    category: "Veg Starters",
    name: "Mushroom Galouti with Sumac Dust",
    description: "Mushroom galouti with soft tacos",
    price: 380,
    isVeg: true,
    isHighlighted: true,
  }),

  // Non-veg starters
  item({
    category: "Non-Veg Starters",
    name: "Chipotle Chicken Tikka",
    description: "Fresh, smoky, signature fusion tikka",
    price: 480,
    isHighlighted: true,
    isNew: true,
  }),
  item({
    category: "Non-Veg Starters",
    name: "Curry Leaf Chicken Tikka",
    description: "Chicken tikka with curry leaves",
    price: 480,
  }),
  item({
    category: "Non-Veg Starters",
    name: "Burmese Chilli Chicken",
    description: "Burmese-style chilli chicken",
    price: 440,
  }),
  item({
    category: "Non-Veg Starters",
    name: "Parmesan Chicken Tikka",
    description: "Creamy herb parmesan chicken tikka",
    price: 480,
  }),
  item({
    category: "Non-Veg Starters",
    name: "Shawarma Chicken Quesadilla",
    description: "Middle Eastern meets Mexican",
    price: 460,
  }),
  item({
    category: "Non-Veg Starters",
    name: "Lamb Galouti with Smash Tacos",
    description: "Spiced minced lamb in soft tacos",
    price: 530,
  }),
  item({
    category: "Non-Veg Starters",
    name: "Lamb Seekh Kebab",
    description: "Juicy seekh with mint chutney",
    price: 560,
  }),
  item({
    category: "Non-Veg Starters",
    name: "Kung Pao Fried Fish",
    description: "Peanuts, chillies and aromatic spices",
    price: 550,
  }),
  item({
    category: "Non-Veg Starters",
    name: "Amritsari Fish Tikka",
    description: "Tangy Punjabi fish tikka",
    price: 560,
  }),
  item({
    category: "Non-Veg Starters",
    name: "Shrimps Tempura With Miso Mayo",
    description: "Crispy tempura with miso mayo",
    price: 580,
  }),
  item({
    category: "Non-Veg Starters",
    name: "Tandoori Prawns",
    description: "Marinated tiger prawns with mint chutney",
    price: 580,
  }),

  // Burgers
  item({
    category: "Burgers",
    name: "Korean Paneer Burger",
    description: "Lettuce, kimchi, paneer & cheese",
    price: 360,
    isVeg: true,
  }),
  item({
    category: "Burgers",
    name: "Curry Chicken Burger",
    description: "Lettuce, curry chicken, onion, tomato, cheese",
    price: 380,
  }),
  item({
    category: "Burgers",
    name: "Classic Chicken Cheese Patty Burger",
    description: "Lettuce, chicken patty, mayo, cucumber, cheese",
    price: 380,
  }),

  // Sandwiches
  item({
    category: "Sandwiches",
    name: "Grilled Cheese Sandwich",
    description: "Lettuce, cheddar, mozzarella",
    price: 360,
    isVeg: true,
    choices: [
      { id: "bread", label: "Bread", options: ["Brown", "White"] },
    ],
  }),
  item({
    category: "Sandwiches",
    name: "Mushroom Melt Sandwich",
    description: "Lettuce, creamy mushroom, cheese",
    price: 380,
    isVeg: true,
    choices: [
      { id: "bread", label: "Bread", options: ["Brown", "White"] },
    ],
  }),
  item({
    category: "Sandwiches",
    name: "Chipotle Chicken Sandwich",
    description: "Chipotle chicken, tomato, onion, cheese",
    price: 390,
    choices: [
      { id: "bread", label: "Bread", options: ["Brown", "White"] },
    ],
  }),

  // Pastas
  ...["Alfredo", "Arrabbiata", "Pesto", "Aglio Olio", "Mamma Rosa"].map(
    (name) =>
      item({
        category: "Pastas",
        name: `Pasta ${name}`,
        description: "Veg / Chicken / Prawns",
        price: 360,
        variants: vegChickenPrawns(360, 380, 420),
      }),
  ),
  item({
    category: "Chef's Pasta",
    name: "Spicy Mac & Cheese",
    description: "Veg or Chicken",
    price: 360,
    variants: vegChicken(360, 420),
  }),
  item({
    category: "Chef's Pasta",
    name: "Lamb Bolognese With Spaghetti",
    description: "Classic lamb bolognese",
    price: 560,
  }),

  // Bowls
  item({
    category: "Bowls",
    name: "Thai Curry Green/Red",
    description: "Thai curry with jasmine rice — choose green or red",
    price: 400,
    variants: vegChickenPrawns(400, 440, 480),
    choices: [
      { id: "style", label: "Style", options: ["Green", "Red"] },
    ],
  }),
  item({
    category: "Bowls",
    name: "Bandi Style Or Avakaya Oil Fried Rice",
    description: "Hyderabad street fried rice",
    price: 340,
    variants: vegEggChickenPrawns(340, 360, 380, 480),
  }),
  item({
    category: "Bowls",
    name: "Noodles",
    description: "Burnt Garlic / Hongkong / Schezwan / Chilly",
    price: 340,
    variants: vegEggChickenPrawns(340, 360, 380, 480),
    choices: [
      {
        id: "style",
        label: "Style",
        options: ["Burnt Garlic", "Hongkong", "Schezwan", "Chilly"],
      },
    ],
  }),
  item({
    category: "Bowls",
    name: "Corn Kichidi with Nachos",
    description: "Soft corn kichidi with crunchy nachos",
    price: 380,
    isVeg: true,
  }),
  item({
    category: "Bowls",
    name: "Mudha Pappu Avakaya Annam",
    description: "South Indian traditional rice bowl with papad & avakaya",
    price: 340,
    isVeg: true,
  }),
  item({
    category: "Bowls",
    name: "Curd Rice",
    description: "Comfort curd rice",
    price: 340,
    isVeg: true,
  }),
  item({
    category: "Bowls",
    name: "Lamb Mong with Coconut Rice",
    description: "Lamb mong with coconut rice",
    price: 560,
  }),
  item({
    category: "Bowls",
    name: "Pepper Chicken with Malabar Paratha",
    description: "Pepper chicken fry with flaky paratha",
    price: 440,
  }),
  item({
    category: "Bowls",
    name: "Chicken Pulao",
    description: "South style pulao with raita",
    price: 450,
  }),
  item({
    category: "Bowls",
    name: "Keema Pulao",
    description: "Juicy keema with fluffy rice",
    price: 560,
  }),
  item({
    category: "Bowls",
    name: "Lunar Tikka Bowl",
    description: "Saffron rice, makhani gravy, salad, chilli cheese naan bombs",
    price: 420,
    variants: [
      { id: "paneer", label: "Paneer", price: 420 },
      { id: "chicken", label: "Chicken", price: 460 },
    ],
    isHighlighted: true,
  }),

  // Curries
  item({
    category: "Indian Curries",
    name: "Paneer Butter Masala",
    description: "",
    price: 400,
    isVeg: true,
  }),
  item({
    category: "Indian Curries",
    name: "Palak Paneer",
    description: "",
    price: 400,
    isVeg: true,
  }),
  item({
    category: "Indian Curries",
    name: "Methi Paneer",
    description: "",
    price: 400,
    isVeg: true,
  }),
  item({
    category: "Indian Curries",
    name: "Ghee Roasted Kaju Mushroom Curry",
    description: "",
    price: 420,
    isVeg: true,
  }),
  item({
    category: "Indian Curries",
    name: "Dal Tadka",
    description: "",
    price: 380,
    isVeg: true,
  }),
  item({
    category: "Indian Curries",
    name: "Egg Masala",
    description: "",
    price: 390,
  }),
  item({
    category: "Indian Curries",
    name: "Egg Bhurji",
    description: "",
    price: 390,
  }),
  item({
    category: "Indian Curries",
    name: "Chicken Ghee Roasted Curry",
    description: "",
    price: 460,
  }),
  item({
    category: "Indian Curries",
    name: "Chicken Tikka Masala",
    description: "",
    price: 460,
  }),
  item({
    category: "Indian Curries",
    name: "Home Made Chicken Curry",
    description: "",
    price: 460,
  }),
  item({
    category: "Indian Curries",
    name: "Butter Chicken",
    description: "",
    price: 470,
  }),
  item({
    category: "Indian Curries",
    name: "Mutton Curry",
    description: "",
    price: 560,
  }),
  item({
    category: "Indian Curries",
    name: "Keema Masala",
    description: "",
    price: 580,
  }),
  item({
    category: "Indian Curries",
    name: "Fish Curry",
    description: "",
    price: 530,
  }),
  item({
    category: "Indian Curries",
    name: "Prawns Curry",
    description: "",
    price: 550,
  }),

  // Pizzas
  item({
    category: "Pizzas",
    name: "Fourfold Cheese Pizza",
    description: "Rich blend of four cheeses",
    price: 480,
    isVeg: true,
  }),
  item({
    category: "Pizzas",
    name: "Creamy Burrata Bliss",
    description: "Creamy burrata with tomato and basil",
    price: 650,
    isVeg: true,
    isHighlighted: true,
  }),
  item({
    category: "Pizzas",
    name: "Tropical Twist Pizza",
    description: "Corn & pineapple",
    price: 480,
    isVeg: true,
  }),
  item({
    category: "Pizzas",
    name: "Ghee Roast Mushroom Pizza",
    description: "Ghee roast mushroom, onion, olive oil, coriander",
    price: 490,
    isVeg: true,
  }),
  item({
    category: "Pizzas",
    name: "Green Feast Pizza",
    description: "Garden fresh veggies",
    price: 470,
    isVeg: true,
  }),
  item({
    category: "Pizzas",
    name: "Paneer Tikka Pizza",
    description: "Paneer tikka with mint sauce",
    price: 510,
    isVeg: true,
  }),
  item({
    category: "Pizzas",
    name: "Ghee Roast Chicken Pizza",
    description: "Ghee roasted chicken, onion, coriander, parmesan",
    price: 540,
  }),
  item({
    category: "Pizzas",
    name: "Peri-Peri Blaze Chicken Pizza",
    description: "Pulled chicken with peri-peri mayo",
    price: 540,
  }),
  item({
    category: "Pizzas",
    name: "Chipotle Chicken Pizza",
    description: "Chipotle chicken, onion, gherkins, parmesan",
    price: 560,
  }),
  item({
    category: "Pizzas",
    name: "Butterlicious Chicken Pizza",
    description: "Butter chicken on cheesy crust",
    price: 560,
  }),
  item({
    category: "Pizzas",
    name: "Chicken Pepp Pizza",
    description: "Chicken & pepperoni duo",
    price: 550,
  }),
  item({
    category: "Pizzas",
    name: "Fiery Lamb Blast Pizza",
    description: "Spicy lamb pizza",
    price: 580,
  }),

  // Mains
  item({
    category: "Mains",
    name: "Charred Paneer Steak",
    description: "Coconut rice, steamed broccoli, Thai red curry",
    price: 480,
    isVeg: true,
  }),
  item({
    category: "Mains",
    name: "Grilled Chicken",
    description: "Herb rice, broccoli, creamy mushroom sauce",
    price: 490,
  }),
  item({
    category: "Mains",
    name: "Grill Fish",
    description: "Basa fillet, wild herb rice, curry madras sauce",
    price: 560,
  }),
  item({
    category: "Mains",
    name: "Butter Garlic Prawns",
    description: "Butter garlic prawns on herb rice",
    price: 580,
  }),

  // Breads
  item({ category: "Indian Breads", name: "Pulka", description: "", price: 20, isVeg: true }),
  item({ category: "Indian Breads", name: "Plain Roti", description: "", price: 20, isVeg: true }),
  item({ category: "Indian Breads", name: "Butter Roti", description: "", price: 30, isVeg: true }),
  item({ category: "Indian Breads", name: "Garlic Roti", description: "", price: 30, isVeg: true }),
  item({ category: "Indian Breads", name: "Plain Naan", description: "", price: 50, isVeg: true }),
  item({ category: "Indian Breads", name: "Butter Naan", description: "", price: 60, isVeg: true }),
  item({ category: "Indian Breads", name: "Garlic Naan", description: "", price: 60, isVeg: true }),
  item({ category: "Indian Breads", name: "Cheese Naan", description: "", price: 90, isVeg: true }),
  item({ category: "Indian Breads", name: "Threaded Paratha", description: "", price: 80, isVeg: true }),
  item({ category: "Indian Breads", name: "Mushroom Kulcha", description: "", price: 90, isVeg: true }),
  item({ category: "Indian Breads", name: "Butter Chicken Kulcha", description: "", price: 120 }),
  item({ category: "Indian Breads", name: "Keema Kulcha", description: "", price: 140 }),

  // Desserts
  item({
    category: "Desserts",
    name: "Brownie with Ice Cream",
    description: "",
    price: 180,
    isVeg: true,
  }),
  item({
    category: "Desserts",
    name: "New York Cheese Cake",
    description: "",
    price: 220,
    isVeg: true,
  }),
  item({
    category: "Desserts",
    name: "Tiramisu Jar",
    description: "",
    price: 230,
    isVeg: true,
  }),
  item({
    category: "Desserts",
    name: "Coconut Tres Leches",
    description: "",
    price: 230,
    isVeg: true,
  }),
  item({
    category: "Desserts",
    name: "Triple Chocolate Mousse",
    description: "",
    price: 230,
    isVeg: true,
  }),
  item({
    category: "Desserts",
    name: "Mango Cream Brulee",
    description: "",
    price: 220,
    isVeg: true,
    isNew: true,
  }),

  // Hot coffees
  item({ category: "Hot Coffees", name: "Espresso", description: "Shot of espresso without milk", price: 130, isVeg: true }),
  item({ category: "Hot Coffees", name: "Americano", description: "Espresso, hot water", price: 180, isVeg: true }),
  item({ category: "Hot Coffees", name: "Cappuccino", description: "Milk foam, espresso", price: 230, isVeg: true }),
  item({ category: "Hot Coffees", name: "Vanilla Cappuccino", description: "Milk, espresso, vanilla", price: 260, isVeg: true }),
  item({ category: "Hot Coffees", name: "Hazelnut Cappuccino", description: "Milk, espresso, hazelnut", price: 260, isVeg: true }),
  item({ category: "Hot Coffees", name: "Lunar Black Beauty", description: "Milk, espresso, choco charcoal, honey", price: 260, isVeg: true, isHighlighted: true }),
  item({ category: "Hot Coffees", name: "Classic Latte", description: "Milk, espresso", price: 230, isVeg: true }),
  item({ category: "Hot Coffees", name: "Lunar Sky Latte", description: "Milk, espresso, blue pea", price: 280, isVeg: true, isNew: true }),
  item({ category: "Hot Coffees", name: "Spanish Matcha Latte", description: "Milk, condensed milk, matcha", price: 310, isVeg: true }),
  item({ category: "Hot Coffees", name: "Mocha Latte", description: "Milk, espresso, chocolate", price: 280, isVeg: true }),
  item({ category: "Hot Coffees", name: "Caramel Caffe Mocha", description: "Milk, espresso, caramel", price: 280, isVeg: true }),
  item({ category: "Hot Coffees", name: "Cortado", description: "Milk, strong espresso", price: 260, isVeg: true }),
  item({ category: "Hot Coffees", name: "Macchiato", description: "Milk foam, espresso", price: 180, isVeg: true }),
  item({ category: "Hot Coffees", name: "Classic Hot Chocolate", description: "Pure dark chocolate, milk", price: 320, isVeg: true }),
  item({ category: "Hot Coffees", name: "Nutella Hot Chocolate", description: "Nutella, chocolate, milk", price: 340, isVeg: true }),
  item({ category: "Hot Coffees", name: "Classic Filter Coffee", description: "", price: 120, isVeg: true }),

  // Teas
  item({ category: "Hot Teas", name: "Classic", description: "Black tea with honey", price: 99, isVeg: true }),
  item({ category: "Hot Teas", name: "LMG Tea", description: "Lime, mint, ginger with honey", price: 120, isVeg: true }),
  item({ category: "Hot Teas", name: "Cardamom Tea", description: "Milk tea, elaichi", price: 99, isVeg: true }),
  item({ category: "Hot Teas", name: "Ginger Basil Tea", description: "Milk tea, ginger, basil", price: 130, isVeg: true }),
  item({ category: "Green Teas", name: "Jasmine Tea", description: "Benefit for brain and heart", price: 240, isVeg: true }),
  item({ category: "Green Teas", name: "Chamomile Tea", description: "Perfect for relaxation", price: 240, isVeg: true }),
  item({ category: "Green Teas", name: "Butterfly Pea", description: "Antioxidant, anti-inflammatory", price: 240, isVeg: true }),
  item({ category: "Green Teas", name: "Hibiscus", description: "Hibiscus fights bacteria", price: 240, isVeg: true }),
  item({ category: "Green Teas", name: "Green Tea Detox", description: "Refreshing antioxidant-rich tea", price: 240, isVeg: true }),

  // Cold drinks
  item({ category: "Frappe Icecream Blended", name: "Peanut Butter", description: "Milk, coffee, peanut", price: 290, isVeg: true }),
  item({ category: "Frappe Icecream Blended", name: "Irish Cream", description: "Milk, coffee, Irish", price: 290, isVeg: true }),
  item({ category: "Frappe Icecream Blended", name: "Affogato", description: "Vanilla ice cream, espresso", price: 170, isVeg: true }),
  item({ category: "Frappuccino", name: "Frappuccino", description: "Milk, espresso, vanilla ice cream", price: 250, isVeg: true }),
  item({ category: "Frappuccino", name: "Nutella Frappe", description: "Milk, espresso, vanilla, nutella", price: 290, isVeg: true }),
  item({ category: "Frappuccino", name: "Hazelnut Frappe", description: "Hazelnut, milk, espresso, ice cream", price: 280, isVeg: true }),
  item({ category: "Frappuccino", name: "Choco Brownie Frappe", description: "Milk, espresso, choco, brownie, ice cream", price: 280, isVeg: true }),
  item({ category: "Frappuccino", name: "Biscoff Frappe", description: "Biscoff, milk, whip cream", price: 360, isVeg: true, discountPercent: 10 }),
  item({ category: "Ice Lattes", name: "Ice Americano", description: "Long espresso, mint", price: 210, isVeg: true }),
  item({ category: "Ice Lattes", name: "Ice Latte", description: "Milk, ice, espresso", price: 240, isVeg: true }),
  item({ category: "Ice Lattes", name: "Tiramisu", description: "Milk, espresso, cream, tiramisu", price: 260, isVeg: true }),
  item({ category: "Ice Lattes", name: "Choco Mocha", description: "Milk, espresso, chocolate", price: 260, isVeg: true }),
  item({ category: "Ice Lattes", name: "Classic Matcha", description: "Matcha & milk", price: 290, isVeg: true }),
  item({ category: "Ice Lattes", name: "Vietnamese", description: "Condensed milk, espresso, almond milk", price: 270, isVeg: true }),
  item({ category: "Ice Tea", name: "Limon Mint", description: "Lime, ice tea, mint", price: 220, isVeg: true }),
  item({ category: "Ice Tea", name: "Hibiscus Mint", description: "Hibiscus tea, mint, citrus", price: 240, isVeg: true }),
  item({ category: "Ice Tea", name: "Peach Ice Tea", description: "Peach, tea, citrus", price: 240, isVeg: true }),

  // Shakes & smoothies
  item({ category: "Milkshakes", name: "Strawberry Choco", description: "Vanilla ice cream, milk, berries, chocolate", price: 280, isVeg: true }),
  item({ category: "Milkshakes", name: "Crunchy Peanut Banana", description: "Milk, ice cream, banana, peanut", price: 280, isVeg: true }),
  item({ category: "Milkshakes", name: "Mango Milk Shake", description: "Milk, ice cream, mango, mint", price: 300, isVeg: true }),
  item({ category: "Milkshakes", name: "Custard Apple Milk Shake", description: "Custard apple, milk", price: 300, isVeg: true }),
  item({ category: "Milkshakes", name: "Brownie Milk Shake", description: "Brownie, milk", price: 280, isVeg: true }),
  item({ category: "Milkshakes", name: "Blended Oreo", description: "Milk, ice cream, chocolate, oreo", price: 270, isVeg: true }),
  item({ category: "Milkshakes", name: "L'mores Berries", description: "Milk, ice cream, cookie, berries", price: 290, isVeg: true }),
  item({ category: "Milkshakes", name: "Cheese Cake", description: "Milk, ice cream, cheesecake", price: 280, isVeg: true }),
  item({ category: "Smoothies", name: "Green Galaxy Smoothie", description: "Avocado, spinach, banana, almond milk", price: 480, isVeg: true, isHighlighted: true }),
  item({ category: "Smoothies", name: "Tropical Sunrise Smoothie", description: "Mango, pineapple, banana, coconut milk", price: 440, isVeg: true }),
  item({ category: "Smoothies", name: "Moonberry Bliss Smoothie", description: "Strawberry, blueberry, banana, greek yogurt", price: 460, isVeg: true }),

  // Mocktails
  item({ category: "Mocktails", name: "Lunarose Lychee Punch", description: "Lychee, elderflower, citrus, strawberry, orange, sparkling", price: 300, isVeg: true }),
  item({ category: "Mocktails", name: "Chilly Pink Guava Mocktail", description: "Pink guava, citrus, sparkling water, green chilly", price: 280, isVeg: true }),
  item({ category: "Mocktails", name: "Pina Colada", description: "Coconut cream, pineapple, berry, ice cream, blue curacao", price: 270, isVeg: true }),
  item({ category: "Mocktails", name: "Walking On The Moon", description: "Cranberry, grape, citrus, lychee, red apple, sparkling", price: 290, isVeg: true, isHighlighted: true }),
  item({ category: "Mocktails", name: "Refresh Coffee", description: "Cranberry, chili coffee, citrus, sparkling water", price: 270, isVeg: true }),
  item({ category: "Mojitos", name: "Classic Mojito", description: "Lime, mint, sparkling water", price: 220, isVeg: true }),
  item({ category: "Mojitos", name: "Blue Berry Mojito", description: "Blue berry, lime, mint, sparkling", price: 240, isVeg: true }),
  item({ category: "Mojitos", name: "Blackcurrant Mojito", description: "Blackcurrant, mint, lime, sparkling", price: 240, isVeg: true }),
  item({ category: "Mojitos", name: "Lavender Mojito", description: "Lavender peach, mint, lime, sparkling", price: 240, isVeg: true }),
  item({ category: "Mojitos", name: "Pink Guava Mojito", description: "Pink guava, lime, mint, sparkling", price: 240, isVeg: true }),
  item({ category: "Mojitos", name: "Blue Lagoon", description: "Lemon, mint, blue curacao, sparkling", price: 270, isVeg: true }),
  item({ category: "Fresh Lime Soda", name: "Fresh Lime Sweet", description: "", price: 120, isVeg: true }),
  item({ category: "Fresh Lime Soda", name: "Fresh Lime Salt", description: "", price: 120, isVeg: true }),
  item({ category: "Fresh Lime Soda", name: "Fresh Lime Sweet And Salt", description: "", price: 120, isVeg: true }),
  item({ category: "Fresh Juices", name: "Watermelon", description: "", price: 160, isVeg: true }),
  item({ category: "Fresh Juices", name: "Pineapple", description: "", price: 180, isVeg: true }),
  item({ category: "Fresh Juices", name: "Orange", description: "", price: 250, isVeg: true }),
  item({ category: "Cold Brews", name: "Passion Fruit Cold Brew", description: "Fermented coffee", price: 230, isVeg: true }),
  item({ category: "Cold Brews", name: "Milk Caramel Cold Brew", description: "Fermented coffee", price: 230, isVeg: true }),
  item({ category: "Cold Brews", name: "Classic Cold Brew", description: "Fermented coffee", price: 210, isVeg: true }),
  item({ category: "Bubble Tea", name: "Nati Taro", description: "Milk, cream, taro, pops", price: 310, isVeg: true, isNew: true }),
  item({ category: "Bubble Tea", name: "Green Melon", description: "Pops, cream, milk, tea, green melon", price: 310, isVeg: true, isNew: true }),
  item({ category: "Extras", name: "Water Bottle", description: "Packaged drinking water", price: 20, isVeg: true }),
];
