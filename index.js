const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
// ✅ Handle preflight requests properly


// -----------------------------
// Middlewares
// -----------------------------
app.use(helmet()); // Security headers
app.use(express.json());

// Shopify App Proxy only calls GET, and Shopify expects query parameters
app.use(cors({
  origin: true, // allow requests from Shopify domain
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));


app.use(express.json());

const {
  SHOPIFY_STORE,
  SHOPIFY_ADMIN_API_KEY,
  SHOPIFY_API_VERSION,
} = process.env;

const shopifyBaseUrl = `https://${SHOPIFY_STORE}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}`;

const checkGiftCard = async (last_characters) => {
  try {
    const response = await axios.get(`${shopifyBaseUrl}/gift_cards.json`, {
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    const giftCards = response.data.gift_cards;
    const matchedCard = giftCards.find(card => card.last_characters === last_characters);
    console.log("matchedCard", matchedCard);

    if (matchedCard) {
      const ca_allow = 'camigrated';
      const matchedCardNote = matchedCard?.note?.toLowerCase();
      if (matchedCardNote?.includes(ca_allow)) {
        return {
          giftcard_id: matchedCard.id,
          last_characters: matchedCard.last_characters,
          allowed_country: 'CA'
        };
      } else {
        return {
          giftcard_id: matchedCard.id,
          last_characters: matchedCard.last_characters,
          allowed_country: 'IN'
        };
      }
    }
    return matchedCard || null;
  } catch (error) {
    console.error('Error fetching gift cards:', error);
    return null;
  }
};

app.get('/', (req, res) => {
  res.send('Gift Card API is running');
});

app.post('/api/gift-cards', async (req, res) => {
  const { last_characters } = req.body;

  if (!last_characters) {
    return res.status(400).json({ error: 'last_characters is required' });
  }

  const gift_allowed = await checkGiftCard(last_characters);
  res.json({ gift_allowed });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
