# Rosie Chat

A responsive, static chat front end for Rosie, connected to the public Hugging Face Space `Nikssxelo123/Rosie-Bot-Nikss` through Gradio’s JavaScript client.

## Run locally

From this folder, start any static HTTP server, for example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`. Opening `index.html` directly as a `file://` URL is not supported because the app uses JavaScript modules.

## Model connection

`app.js` connects to the public Space and calls its `/respond` endpoint. Conversation context is kept in the page’s memory and sent with each request; refreshing the page starts a new conversation. The site does not contain or need a Hugging Face access token. Do not add a private token to browser code. If the Space is made private, use a server-side proxy and store credentials on the server instead.

The page loads the pinned `@gradio/client` package from jsDelivr. Messages are sent to Rosie’s Hugging Face Space to generate replies, so users should avoid entering sensitive information.

## Deploy

This is a static site and can be served from any static web host. GitHub Pages is not enabled automatically by this repository change; configure hosting separately if you want a public website URL.
