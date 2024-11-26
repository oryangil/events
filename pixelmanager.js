const express = require('express');
const stripe = require('stripe')('your_stripe_secret_key'); // [1] SUBSTITUA: Chave secreta da sua conta Stripe
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.raw({ type: 'application/json' }));

const FACEBOOK_PIXEL_ID = 'your_pixel_id'; // [2] SUBSTITUA: ID do seu Pixel do Facebook

app.post('/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature']; 
    const endpointSecret = 'your_webhook_secret'; // [3] SUBSTITUA: Segredo do webhook da sua conta Stripe

    try {
        const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;

            // Enviar evento para o Meta Pixel
            const pixelEvent = {
                event_name: 'Purchase',
                event_time: Math.floor(Date.now() / 1000),
                user_data: {
                    client_ip_address: req.ip,
                    client_user_agent: req.headers['user-agent'],
                },
                custom_data: {
                    value: session.amount_total / 100,
                    currency: session.currency.toUpperCase(),
                },
                event_id: session.id,
                action_source: 'website',
            };

            await axios.post(
                `https://graph.facebook.com/v13.0/${FACEBOOK_PIXEL_ID}/events`, // [4] NÃO ESQUEÇA: Certifique-se de que o ID do Pixel está correto
                {
                    data: [pixelEvent],
                    access_token: 'your_facebook_access_token', // [5] SUBSTITUA: Token de acesso da API do Facebook
                }
            );
        }

        res.status(200).send('Event received');
    } catch (err) {
        console.error('Webhook error', err.message);
        res.status(400).send('Webhook error');
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));
