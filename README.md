# Development

1. Modify vite.config.mts and change `http://localhost:11080` to point to your Scrypted server IP and http port 10080 (not https).
2. Start the server on the local machine using: `npm run dev`
3. Visit `http://localhost:4000`. This dev server will reverse proxy the Scrypted server IP entered in `Step 1`.
