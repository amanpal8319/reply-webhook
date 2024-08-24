const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
require('dotenv').config();

const app = express().use(bodyParser.json());

const token = process.env.TOKEN;
const verifyToken = process.env.VERIFY_TOKEN;

app.listen(3000 || process.env.PORT, () => {
    console.log("Webhook is listening");
});

// Verify webhook
app.get("/webhook", (req, res) => {
    let mode = req.query["hub.mode"];
    let challenge = req.query["hub.challenge"];
    let token = req.query["hub.verify_token"];

    if (mode && token) {
        if (mode === "subscribe" && token === verifyToken) {
            res.status(200).send(challenge);
        } else {
            res.status(403).send("Forbidden");
        }
    }
});

// Handle incoming messages
app.post("/webhook", (req, res) => {
    let body = req.body;

    console.log(JSON.stringify(body, null, 2));

    if (body.object) {
        if (body.entry &&
            body.entry[0].changes &&
            body.entry[0].changes[0].value.messages &&
            body.entry[0].changes[0].value.messages[0]
        ) {
            let phone_number_id = body.entry[0].changes[0].value.metadata.phone_number_id;
            let from = body.entry[0].changes[0].value.messages[0].from;
            let msg_body = body.entry[0].changes[0].value.messages[0].text.body;

            console.log("Phone Number ID: " + phone_number_id);
            console.log("From: " + from);
            console.log("Message: " + msg_body);

            // Send a reply message
            axios({
                method: "POST",
                url: `https://graph.facebook.com/v17.0/${phone_number_id}/messages?access_token=${token}`,
                data: {
                    messaging_product: "whatsapp",
                    to: from,
                    text: {
                        body: `Thank you for your message: "${msg_body}". We will get back to you soon!`
                    }
                },
                headers: {
                    "Content-Type": "application/json"
                }
            }).catch(error => {
                console.error("Error sending message: ", error);
            });

            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    }
});

app.get("/", (req, res) => {
    res.status(200).send("Hello, this is the WhatsApp webhook setup");
});
