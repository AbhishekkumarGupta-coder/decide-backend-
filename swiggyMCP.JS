import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

// Swiggy MCP Server URLs
const SERVERS = {
  food: 'https://mcp.swiggy.com/food',
  instamart: 'https://mcp.swiggy.com/im',
  dineout: 'https://mcp.swiggy.com/dineout',
};

// Your credentials from Swiggy (paste when received)
const CLIENT_ID = process.env.SWIGGY_CLIENT_ID || null;
const ACCESS_TOKEN = process.env.SWIGGY_ACCESS_TOKEN || null;

// ── Mock data for local dev (used when no credentials) ──
const MOCK = {
  addresses: [
    { id: 'addr_1', label: 'Home', display: 'Koramangala, Bangalore' },
    { id: 'addr_2', label: 'Work', display: 'Indiranagar, Bangalore' },
  ],
  restaurants: [
    { id: 'rest_1', name: 'Behrouz Biryani', rating: 4.5, deliveryTime: '35 mins', availabilityStatus: 'OPEN', cuisine: 'Biryani', priceForTwo: 600 },
    { id: 'rest_2', name: 'Paradise Biryani', rating: 4.3, deliveryTime: '25 mins', availabilityStatus: 'OPEN', cuisine: 'Biryani', priceForTwo: 450 },
    { id: 'rest_3', name: 'Leon\'s Burgers', rating: 4.4, deliveryTime: '20 mins', availabilityStatus: 'OPEN', cuisine: 'Burgers', priceForTwo: 350 },
  ],
  menu: [
    { id: 'item_1', name: 'Chicken Dum Biryani', price: 299, description: 'Slow cooked dum biryani', category: 'Biryani' },
    { id: 'item_2', name: 'Mutton Biryani', price: 399, description: 'Premium mutton biryani', category: 'Biryani' },
    { id: 'item_3', name: 'Veg Biryani', price: 199, description: 'Aromatic veg biryani', category: 'Biryani' },
  ],
  coupons: [
    { code: 'SWIGGY50', discount: '50% off up to ₹100', requiresOnlinePayment: false },
    { code: 'FIRST200', discount: '₹200 off on first order', requiresOnlinePayment: false },
  ],
  order: {
    orderId: 'ORD_MOCK_001',
    status: 'CONFIRMED',
    estimatedDelivery: '35 mins',
    total: 299,
    paymentMethod: 'COD',
  },
};

// ── MCP Client ──
let foodClient = null;

async function getFoodClient() {
  if (!CLIENT_ID || !ACCESS_TOKEN) return null; // use mock
  if (foodClient) return foodClient;

  const transport = new StreamableHTTPClientTransport(
    new URL(SERVERS.food),
    {
      requestInit: {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'x-client-id': CLIENT_ID,
        },
      },
    }
  );

  foodClient = new Client({ name: 'decide-agent', version: '1.0.0' });
  await foodClient.connect(transport);
  return foodClient;
}

async function callTool(client, name, args = {}) {
  const result = await client.callTool({ name, arguments: args });
  return result;
}

// ── Tool wrappers ──

export async function getAddresses() {
  const client = await getFoodClient();
  if (!client) return { success: true, data: MOCK.addresses, mock: true };
  const result = await callTool(client, 'get_addresses');
  return { success: true, data: result };
}

export async function searchRestaurants(addressId, query) {
  const client = await getFoodClient();
  if (!client) {
    const filtered = query
      ? MOCK.restaurants.filter(r =>
          r.name.toLowerCase().includes(query.toLowerCase()) ||
          r.cuisine.toLowerCase().includes(query.toLowerCase())
        )
      : MOCK.restaurants;
    return { success: true, data: { restaurants: filtered }, mock: true };
  }
  const result = await callTool(client, 'search_restaurants', { addressId, query });
  return { success: true, data: result };
}

export async function getRestaurantMenu(restaurantId) {
  const client = await getFoodClient();
  if (!client) return { success: true, data: { items: MOCK.menu, restaurantId }, mock: true };
  const result = await callTool(client, 'get_restaurant_menu', { restaurantId });
  return { success: true, data: result };
}

export async function updateFoodCart(restaurantId, items) {
  const client = await getFoodClient();
  if (!client) return { success: true, data: { restaurantId, items }, mock: true };
  const result = await callTool(client, 'update_food_cart', { restaurantId, items });
  return { success: true, data: result };
}

export async function getFoodCart() {
  const client = await getFoodClient();
  if (!client) return { success: true, data: { items: MOCK.menu.slice(0, 1), total: 299 }, mock: true };
  const result = await callTool(client, 'get_food_cart');
  return { success: true, data: result };
}

export async function fetchFoodCoupons() {
  const client = await getFoodClient();
  if (!client) return { success: true, data: MOCK.coupons, mock: true };
  const result = await callTool(client, 'fetch_food_coupons');
  return { success: true, data: result };
}

export async function applyFoodCoupon(code) {
  const client = await getFoodClient();
  if (!client) return { success: true, data: { code, applied: true }, mock: true };
  const result = await callTool(client, 'apply_food_coupon', { code });
  return { success: true, data: result };
}

export async function placeFoodOrder(paymentMethod = 'COD') {
  const client = await getFoodClient();
  if (!client) return { success: true, data: MOCK.order, mock: true };

  // Safety check — get cart first
  const cart = await getFoodCart();
  if (cart.data.total > 1000) {
    throw new Error('Cart exceeds ₹1000 cap');
  }

  const result = await callTool(client, 'place_food_order', { paymentMethod });
  return { success: true, data: result };
}

export async function trackFoodOrder(orderId) {
  const client = await getFoodClient();
  if (!client) return {
    success: true,
    data: { orderId, status: 'OUT_FOR_DELIVERY', eta: '12 mins', deliveryPartner: 'Raju' },
    mock: true
  };
  const result = await callTool(client, 'track_food_order', { orderId });
  return { success: true, data: result };
}

export async function getFoodOrders() {
  const client = await getFoodClient();
  if (!client) return {
    success: true,
    data: [
      { orderId: 'ORD_001', restaurant: 'Behrouz Biryani', items: ['Chicken Biryani'], total: 299, date: '2026-05-07' },
      { orderId: 'ORD_002', restaurant: 'Leon\'s Burgers', items: ['Chicken Burger'], total: 199, date: '2026-05-06' },
      { orderId: 'ORD_003', restaurant: 'Behrouz Biryani', items: ['Chicken Biryani'], total: 299, date: '2026-05-04' },
    ],
    mock: true
  };
  const result = await callTool(client, 'get_food_orders');
  return { success: true, data: result };
}

// ── Full order flow (used by Solo Decision agent) ──
export async function runFullOrderFlow(query, budget) {
  try {
    // 1. Get address
    const addresses = await getAddresses();
    const address = addresses.data[0];

    // 2. Search restaurants
    const restaurants = await searchRestaurants(address.id, query);
    const openRestaurants = restaurants.data.restaurants.filter(
      r => r.availabilityStatus === 'OPEN'
    );

    if (openRestaurants.length === 0) {
      return { success: false, error: 'No open restaurants found' };
    }

    // 3. Pick best restaurant within budget
    const affordable = openRestaurants.filter(r => r.priceForTwo <= budget * 2);
    const restaurant = affordable[0] || openRestaurants[0];

    // 4. Get menu
    const menu = await getRestaurantMenu(restaurant.id);
    const affordableItems = menu.data.items.filter(i => i.price <= budget);

    if (affordableItems.length === 0) {
      return { success: false, error: 'No items within budget' };
    }

    const item = affordableItems[0];

    // 5. Build cart
    await updateFoodCart(restaurant.id, [{ itemId: item.id, quantity: 1 }]);

    // 6. Apply coupon
    const coupons = await fetchFoodCoupons();
    const codCoupon = coupons.data.find(c => !c.requiresOnlinePayment);
    if (codCoupon) await applyFoodCoupon(codCoupon.code);

    // 7. Get cart summary
    const cart = await getFoodCart();

    return {
      success: true,
      restaurant: restaurant.name,
      item: item.name,
      price: item.price,
      total: cart.data.total,
      coupon: codCoupon?.code || null,
      address: address.display,
      readyToOrder: true,
      mock: addresses.mock || false,
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
