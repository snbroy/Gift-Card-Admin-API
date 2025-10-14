const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const {
  SHOPIFY_STORE,
  SHOPIFY_ADMIN_API_KEY,
  SHOPIFY_API_VERSION,
} = process.env;

const shopifyBaseUrl = `https://${SHOPIFY_STORE}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}`;

const checkGiftCard = async (last_characters) => {
    try{
        const response = await axios.get(`${shopifyBaseUrl}/gift_cards.json`, {
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_KEY,
                'Content-Type': 'application/json',
            },
        });
        const giftCards = response.data.gift_cards;
        const matchedCard = giftCards.find(card => card.last_characters === last_characters);
        console.log("matchedCard", matchedCard);
        if(matchedCard){
            const ca_allow = 'CAmigrated';
            if(matchedCard?.note?.includes(ca_allow)){
               
                const obj = {
                    'giftcard_id': matchedCard.id,
                    'allowed_country': 'CA'
                }
                return obj;
            }
            else{
                const obj = {
                    'giftcard_id': matchedCard.id,
                    'allowed_country': 'US'
                }
                return obj;
            }
        }
        return matchedCard || null;

    } catch (error) {
        console.error('Error fetching gift cards:', error);
        return null;
    }
};

// Endpoint to fetch gift cards
app.get('/api/gift-cards', async (req, res) => {
    const reqBody = req.body;
    const last_characters = reqBody?.last_characters;
    if(!last_characters){
        return res.status(400).json({ error: 'last_characters is required' });
    }
    const gift_allowed = await checkGiftCard(last_characters);
    res.json({ gift_allowed });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});