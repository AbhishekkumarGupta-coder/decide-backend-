import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

// ── Swiggy MCP Server URLs ──
const SERVERS = {
  food: 'https://mcp.swiggy.com/food',
  instamart: 'https://mcp.swiggy.com/im',
  dineout: 'https://mcp.swiggy.com/dineout',
};

// ── Credentials (paste when received from Swiggy) ──
const CLIENT_ID = process.env.SWIGGY_CLIENT_ID || null;
const ACCESS_TOKEN = process.env.SWIGGY_ACCESS_TOKEN || null;

const isMock = !CLIENT_ID || !ACCESS_TOKEN;

// ══════════════════════════════════════════
// MOCK DATA
// ══════════════════════════════════════════
const MOCK = {
  addresses: [
    { id: 'addr_1', label: 'Home', display: 'Koramangala, Bangalore', lat: 12.9352, lng: 77.6245 },
    { id: 'addr_2', label: 'Work', display: 'Indiranagar, Bangalore', lat: 12.9784, lng: 77.6408 },
  ],
  restaurants: {
    food: [
      { id: 'rest_1', name: 'Behrouz Biryani', rating: 4.5, deliveryTime: '35 mins', availabilityStatus: 'OPEN', cuisine: 'Biryani', priceForTwo: 600 },
      { id: 'rest_2', name: 'Paradise Biryani', rating: 4.3, deliveryTime: '25 mins', availabilityStatus: 'OPEN', cuisine: 'Biryani', priceForTwo: 450 },
      { id: 'rest_3', name: "Leon's Burgers", rating: 4.4, deliveryTime: '20 mins', availabilityStatus: 'OPEN', cuisine: 'Burgers', priceForTwo: 350 },
      { id: 'rest_4', name: 'Meghana Foods', rating: 4.6, deliveryTime: '30 mins', availabilityStatus: 'OPEN', cuisine: 'South Indian', priceForTwo: 500 },
    ],
    dineout: [
      { id: 'dine_1', name: 'Farzi Cafe', rating: 4.5, cuisine: 'Modern Indian', priceForTwo: 1800, availability: 'AVAILABLE', area: 'Indiranagar' },
      { id: 'dine_2', name: 'Toast & Tonic', rating: 4.4, cuisine: 'Continental', priceForTwo: 2000, availability: 'AVAILABLE', area: 'Indiranagar' },
      { id: 'dine_3', name: 'Truffles', rating: 4.3, cuisine: 'Burgers & More', priceForTwo: 800, availability: 'AVAILABLE', area: 'Koramangala' },
    ],
  },
  menu: {
    food: [
      { id: 'item_1', name: 'Chicken Dum Biryani', price: 299, description: 'Slow cooked dum biryani', category: 'Biryani' },
      { id: 'item_2', name: 'Mutton Biryani', price: 399, description: 'Premium mutton biryani', category: 'Biryani' },
      { id: 'item_3', name: 'Veg Biryani', price: 199, description: 'Aromatic veg biryani', category: 'Biryani' },
      { id: 'item_4', name: 'Raita', price: 49, description: 'Chilled raita', category: 'Sides' },
    ],
  },
  products: [
    { id: 'prod_1', name: 'Amul Milk 500ml', variants: [{ spinId: 'spin_1', price: 28 }], category: 'Dairy' },
    { id: 'prod_2', name: 'Britannia Bread', variants: [{ spinId: 'spin_2', price: 45 }], category: 'Bakery' },
    { id: 'prod_3', name: 'Bananas (6 pcs)', variants: [{ spinId: 'spin_3', price: 39 }], category: 'Fruits' },
    { id: 'prod_4', name: 'Eggs (12 pcs)', variants: [{ spinId: 'spin_4', price: 89 }], category: 'Dairy' },
  ],
  coupons: [
    { code: 'SWIGGY50', discount: '50% off up to ₹100', requiresOnlinePayment: false },
    { code: 'NEWUSER200', discount: '₹200 off on first order', requiresOnlinePayment: false },
  ],
  slots: [
    { slotId: 'slot_1', time: '7:30 PM', date: 'Today', band: 'dinner', available: true },
    { slotId: 'slot_2', time: '8:00 PM', date: 'Today', band: 'dinner', available: true },
    { slotId: 'slot_3', time: '8:30 PM', date: 'Today', band: 'dinner', available: true },
    { slotId: 'slot_4', time: '1:00 PM', date: 'Tomorrow', band: 'lunch', available: true },
  ],
  orders: {
    food: { orderId: 'ORD_MOCK_001', status: 'CONFIRMED', estimatedDelivery: '35 mins', total: 299, paymentMethod: 'COD' },
    instamart: { orderId: 'ORD_IM_001', status: 'CONFIRMED', estimatedDelivery: '12 mins', total: 156, paymentMethod: 'COD' },
    dineout: { bookingId: 'BK_001', status: 'CONFIRMED', restaurant: 'Farzi Cafe', slot: '7:30 PM', guestCount: 2, confirmationCode: 'FC2026001' },
  },
  history: [
    { orderId: 'ORD_001', restaurant: 'Behrouz Biryani', items: ['Chicken Biryani'], total: 299, date: '2026-05-07' },
    { orderId: 'ORD_002', restaurant: "Leon's Burgers", items: ['Chicken Burger'], total: 199, date: '2026-05-06' },
    { orderId: 'ORD_003', restaurant: 'Behrouz Biryani', items: ['Chicken Biryani'], total: 299, date: '2026-05-04' },
  ],
};

// ══════════════════════════════════════════
// MCP CLIENT FACTORY
// ══════════════════════════════════════════
const clients = {};

async function getClient(server) {
  if (isMock) return null;
  if (clients[server]) return clients[server];

  const transport = new StreamableHTTPClientTransport(
    new URL(SERVERS[server]),
    {
      requestInit: {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'x-client-id': CLIENT_ID,
        },
      },
    }
  );

  const client = new Client({ name: 'decide-agent', version: '1.0.0' });
  await client.connect(transport);
  clients[server] = client;
  return client;
}

async function callTool(server, name, args = {}) {
  const client = await getClient(server);
  if (!client) return null;
  return await client.callTool({ name, arguments: args });
}

// ══════════════════════════════════════════
// FOOD TOOLS
// ══════════════════════════════════════════

export async function getAddresses() {
  const result = await callTool('food', 'get_addresses');
  if (!result) return { success: true, data: MOCK.addresses, mock: true };
  return { success: true, data: result };
}

export async function searchRestaurants(addressId, query) {
  const result = await callTool('food', 'search_restaurants', { addressId, query });
  if (!result) {
    const filtered = query
      ? MOCK.restaurants.food.filter(r =>
          r.name.toLowerCase().includes(query.toLowerCase()) ||
          r.cuisine.toLowerCase().includes(query.toLowerCase())
        )
      : MOCK.restaurants.food;
    return { success: true, data: { restaurants: filtered }, mock: true };
  }
  return { success: true, data: result };
}

export async function getRestaurantMenu(restaurantId) {
  const result = await callTool('food', 'get_restaurant_menu', { restaurantId });
  if (!result) return { success: true, data: { items: MOCK.menu.food, restaurantId }, mock: true };
  return { success: true, data: result };
}

export async function updateFoodCart(restaurantId, items) {
  const result = await callTool('food', 'update_food_cart', { restaurantId, items });
  if (!result) return { success: true, data: { restaurantId, items }, mock: true };
  return { success: true, data: result };
}

export async function getFoodCart() {
  const result = await callTool('food', 'get_food_cart');
  if (!result) return { success: true, data: { items: MOCK.menu.food.slice(0, 1), total: 299 }, mock: true };
  return { success: true, data: result };
}

export async function fetchFoodCoupons() {
  const result = await callTool('food', 'fetch_food_coupons');
  if (!result) return { success: true, data: MOCK.coupons, mock: true };
  return { success: true, data: result };
}

export async function applyFoodCoupon(code) {
  const result = await callTool('food', 'apply_food_coupon', { code });
  if (!result) return { success: true, data: { code, applied: true }, mock: true };
  return { success: true, data: result };
}

export async function placeFoodOrder() {
  const cart = await getFoodCart();
  if (cart.data.total > 1000) throw new Error('Cart exceeds ₹1000 cap');
  const result = await callTool('food', 'place_food_order', { paymentMethod: 'COD' });
  if (!result) return { success: true, data: MOCK.orders.food, mock: true };
  return { success: true, data: result };
}

export async function trackFoodOrder(orderId) {
  const result = await callTool('food', 'track_food_order', { orderId });
  if (!result) return { success: true, data: { orderId, status: 'OUT_FOR_DELIVERY', eta: '12 mins', deliveryPartner: 'Raju' }, mock: true };
  return { success: true, data: result };
}

export async function getFoodOrders() {
  const result = await callTool('food', 'get_food_orders');
  if (!result) return { success: true, data: MOCK.history, mock: true };
  return { success: true, data: result };
}

// ══════════════════════════════════════════
// INSTAMART TOOLS
// ══════════════════════════════════════════

export async function searchProducts(addressId, query) {
  const result = await callTool('instamart', 'search_products', { addressId, query });
  if (!result) {
    const filtered = query
      ? MOCK.products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
      : MOCK.products;
    return { success: true, data: { products: filtered }, mock: true };
  }
  return { success: true, data: result };
}

export async function getGoToItems(addressId) {
  const result = await callTool('instamart', 'your_go_to_items', { addressId });
  if (!result) return { success: true, data: MOCK.products.slice(0, 3), mock: true };
  return { success: true, data: result };
}

export async function updateInstamartCart(items) {
  const result = await callTool('instamart', 'update_cart', { items });
  if (!result) return { success: true, data: { items }, mock: true };
  return { success: true, data: result };
}

export async function getInstamartCart() {
  const result = await callTool('instamart', 'get_cart');
  if (!result) return { success: true, data: { items: MOCK.products.slice(0, 2), total: 156 }, mock: true };
  return { success: true, data: result };
}

export async function checkoutInstamart() {
  const cart = await getInstamartCart();
  if (cart.data.total < 99) throw new Error('Minimum order ₹99 not met');
  const result = await callTool('instamart', 'checkout', { paymentMethod: 'COD' });
  if (!result) return { success: true, data: MOCK.orders.instamart, mock: true };
  return { success: true, data: result };
}

export async function trackInstamartOrder(orderId) {
  const result = await callTool('instamart', 'track_order', { orderId });
  if (!result) return { success: true, data: { orderId, status: 'OUT_FOR_DELIVERY', eta: '8 mins' }, mock: true };
  return { success: true, data: result };
}

// ══════════════════════════════════════════
// DINEOUT TOOLS
// ══════════════════════════════════════════

export async function searchDineoutRestaurants(lat, lng, query) {
  const result = await callTool('dineout', 'search_restaurants_dineout', { lat, lng, query });
  if (!result) {
    const filtered = query
      ? MOCK.restaurants.dineout.filter(r =>
          r.name.toLowerCase().includes(query.toLowerCase()) ||
          r.cuisine.toLowerCase().includes(query.toLowerCase())
        )
      : MOCK.restaurants.dineout;
    return { success: true, data: { restaurants: filtered }, mock: true };
  }
  return { success: true, data: result };
}

export async function getDineoutRestaurantDetails(restaurantId) {
  const result = await callTool('dineout', 'get_restaurant_details', { restaurantId });
  if (!result) {
    const restaurant = MOCK.restaurants.dineout.find(r => r.id === restaurantId) || MOCK.restaurants.dineout[0];
    return { success: true, data: restaurant, mock: true };
  }
  return { success: true, data: result };
}

export async function getAvailableSlots(restaurantId, date, guestCount) {
  const result = await callTool('dineout', 'get_available_slots', { restaurantId, date, guestCount });
  if (!result) return { success: true, data: { slots: MOCK.slots }, mock: true };
  return { success: true, data: result };
}

export async function bookTable(restaurantId, slotId, guestCount) {
  const result = await callTool('dineout', 'book_table', { restaurantId, slotId, guestCount });
  if (!result) return { success: true, data: MOCK.orders.dineout, mock: true };
  return { success: true, data: result };
}

export async function getBookingStatus(bookingId) {
  const result = await callTool('dineout', 'get_booking_status', { bookingId });
  if (!result) return { success: true, data: MOCK.orders.dineout, mock: true };
  return { success: true, data: result };
}

// ══════════════════════════════════════════
// RECIPE 1 — ORDER FOOD END-TO-END
// Used by: Solo Decision, Budget Survival, Instant Decision
// ══════════════════════════════════════════
export async function runFoodOrderFlow(query, budget) {
  try {
    // 1. Get address
    const addresses = await getAddresses();
    const address = addresses.data[0];

    // 2. Search restaurants
    const restaurants = await searchRestaurants(address.id, query);
    const open = restaurants.data.restaurants.filter(r => r.availabilityStatus === 'OPEN');
    if (open.length === 0) return { success: false, error: 'No open restaurants found' };

    // 3. Pick best within budget
    const affordable = open.filter(r => r.priceForTwo <= budget * 2);
    const restaurant = affordable[0] || open[0];

    // 4. Get menu
    const menu = await getRestaurantMenu(restaurant.id);
    const items = menu.data.items.filter(i => i.price <= budget);
    if (items.length === 0) return { success: false, error: 'No items within budget' };
    const item = items[0];

    // 5. Build cart
    await updateFoodCart(restaurant.id, [{ itemId: item.id, quantity: 1 }]);

    // 6. Apply coupon
    const coupons = await fetchFoodCoupons();
    const coupon = coupons.data.find(c => !c.requiresOnlinePayment);
    if (coupon) await applyFoodCoupon(coupon.code);

    // 7. Get cart summary
    const cart = await getFoodCart();

    return {
      success: true,
      recipe: 'order-food',
      restaurant: restaurant.name,
      item: item.name,
      price: item.price,
      total: cart.data.total,
      coupon: coupon?.code || null,
      couponDiscount: coupon?.discount || null,
      address: address.display,
      deliveryTime: restaurant.deliveryTime,
      readyToOrder: true,
      mock: addresses.mock || false,
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ══════════════════════════════════════════
// RECIPE 2 — ORDER GROCERIES END-TO-END
// Used by: Budget Survival (Instamart), Reorder Intelligence
// ══════════════════════════════════════════
export async function runGroceryOrderFlow(query, useGoToItems = false) {
  try {
    // 1. Get address
    const addresses = await getAddresses();
    const address = addresses.data[0];

    let products;
    if (useGoToItems) {
      // Quick reorder path
      const goTo = await getGoToItems(address.id);
      products = goTo.data;
    } else {
      // Search path
      const results = await searchProducts(address.id, query);
      products = results.data.products;
    }

    if (!products || products.length === 0) return { success: false, error: 'No products found' };

    // 2. Build cart with first product
    const product = products[0];
    const variant = product.variants[0];
    await updateInstamartCart([{ spinId: variant.spinId, quantity: 1 }]);

    // 3. Get cart
    const cart = await getInstamartCart();

    // 4. Checkout
    const order = await checkoutInstamart();

    return {
      success: true,
      recipe: 'order-groceries',
      product: product.name,
      price: variant.price,
      total: cart.data.total,
      address: address.display,
      estimatedDelivery: '10-20 mins',
      orderId: order.data.orderId,
      readyToOrder: true,
      mock: addresses.mock || false,
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ══════════════════════════════════════════
// RECIPE 3 — BOOK A TABLE END-TO-END
// Used by: Group Decision (Dineout), Evening Planner
// ══════════════════════════════════════════
export async function runBookTableFlow(query, guestCount, date) {
  try {
    // 1. Get location
    const addresses = await getAddresses();
    const location = addresses.data[0];

    // 2. Search dineout restaurants
    const restaurants = await searchDineoutRestaurants(
      location.lat || 12.9352,
      location.lng || 77.6245,
      query
    );
    const available = restaurants.data.restaurants.filter(r => r.availability === 'AVAILABLE');
    if (available.length === 0) return { success: false, error: 'No available restaurants found' };

    const restaurant = available[0];

    // 3. Get restaurant details
    const details = await getDineoutRestaurantDetails(restaurant.id);

    // 4. Get available slots
    const today = date || new Date().toISOString().split('T')[0];
    const slots = await getAvailableSlots(restaurant.id, today, guestCount);
    if (!slots.data.slots || slots.data.slots.length === 0) {
      return { success: false, error: 'No slots available' };
    }

    const slot = slots.data.slots[0];

    // 5. Book table
    const booking = await bookTable(restaurant.id, slot.slotId, guestCount);

    // 6. Confirm
    const status = await getBookingStatus(booking.data.bookingId);

    return {
      success: true,
      recipe: 'book-table',
      restaurant: restaurant.name,
      cuisine: restaurant.cuisine,
      slot: `${slot.time}, ${slot.date}`,
      guestCount,
      bookingId: booking.data.bookingId,
      confirmationCode: status.data.confirmationCode,
      area: restaurant.area,
      priceForTwo: restaurant.priceForTwo,
      readyToBook: true,
      mock: addresses.mock || false,
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ══════════════════════════════════════════
// RECIPE 4 — PLAN MY EVENING (COMBINED)
// Used by: Evening Planner, Group Decision
// ══════════════════════════════════════════
export async function runPlanEveningFlow(query, guestCount, budget) {
  try {
    const addresses = await getAddresses();
    const location = addresses.data[0];

    // Run food + dineout in parallel
    const [foodResult, dineoutResult] = await Promise.all([
      searchRestaurants(location.id, query),
      searchDineoutRestaurants(location.lat || 12.9352, location.lng || 77.6245, query),
    ]);

    const openFood = foodResult.data.restaurants.filter(r => r.availabilityStatus === 'OPEN');
    const availDineout = dineoutResult.data.restaurants.filter(r => r.availability === 'AVAILABLE');

    // Decision: dine-out if budget allows, else order in
    const dineoutOption = availDineout.find(r => r.priceForTwo <= budget * guestCount);
    const foodOption = openFood[0];

    let recommendation;
    if (dineoutOption && budget >= dineoutOption.priceForTwo / 2) {
      recommendation = {
        type: 'dineout',
        restaurant: dineoutOption.name,
        cuisine: dineoutOption.cuisine,
        pricePerPerson: Math.round(dineoutOption.priceForTwo / 2),
        area: dineoutOption.area,
        reason: 'Budget allows for a sit-down meal — make it special.',
      };
    } else {
      recommendation = {
        type: 'delivery',
        restaurant: foodOption?.name || 'Behrouz Biryani',
        cuisine: foodOption?.cuisine || 'Biryani',
        deliveryTime: foodOption?.deliveryTime || '35 mins',
        reason: 'Order in and relax — food comes to you.',
      };
    }

    return {
      success: true,
      recipe: 'plan-evening',
      recommendation,
      alternatives: {
        dineout: availDineout.slice(0, 2).map(r => r.name),
        delivery: openFood.slice(0, 2).map(r => r.name),
      },
      location: location.display,
      mock: addresses.mock || false,
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ══════════════════════════════════════════
// CONVENIENCE EXPORT — all flows in one object
// ══════════════════════════════════════════
export const swiggy = {
  // Individual tools
  getAddresses,
  searchRestaurants,
  getRestaurantMenu,
  updateFoodCart,
  getFoodCart,
  fetchFoodCoupons,
  applyFoodCoupon,
  placeFoodOrder,
  trackFoodOrder,
  getFoodOrders,
  searchProducts,
  getGoToItems,
  updateInstamartCart,
  getInstamartCart,
  checkoutInstamart,
  trackInstamartOrder,
  searchDineoutRestaurants,
  getDineoutRestaurantDetails,
  getAvailableSlots,
  bookTable,
  getBookingStatus,

  // Full recipes
  runFoodOrderFlow,
  runGroceryOrderFlow,
  runBookTableFlow,
  runPlanEveningFlow,
};