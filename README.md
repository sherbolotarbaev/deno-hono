
# 🦖 Fastest API with Deno 2.0 & Hono.js

This project showcases a performant API built with **Deno 2.0** and **Hono.js**. It includes message handling, caching, validation, and security features.

## 🚀 Features

- **Deno 2.0**: A modern, fast JavaScript/TypeScript runtime.
- **Hono.js**: Ultra-fast web framework for handling requests.
- **Message Caching**: Uses a cache to store messages with timestamps.
- **Validation**: Validates request body using `Zod`.
- **Security**: Secure headers for enhanced API security.
- **CORS & Logging**: CORS and request logging are enabled for better API handling.

## 🛠️ Installation

1. Install [Deno](https://deno.land) (if not already installed):

   ```bash
   deno --version
   ```

2. Clone the repository:

   ```bash
   git clone https://github.com/sherbolotarbaev/deno-hono.git
   cd deno-hono
   ```

3. Run the API:

   ```bash
   deno task dev
   ```

   The server will start on `http://localhost:999`.

## 📚 API Endpoints

- **GET /messages**: Fetch all cached messages.

  Example:

  ```bash
  curl http://localhost:999/messages
  ```

- **POST /messages**: Add a new message to the cache. Expects a JSON body:

  ```json
  {
    "message": "Your message here"
  }
  ```

  Example:

  ```bash
  curl -X POST http://localhost:999/messages \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello World"}'
  ```

## 📦 Message Caching

Messages are cached daily, using a date-based key format. Cached messages can be fetched via `GET /messages` or added via `POST /messages`.

## 🔐 Security

The API is secured with:
- **CORS**: Allows cross-origin requests.
- **Secure Headers**: Provides protection against common web vulnerabilities.

## 🧑‍💻 Development

- To lint or format your code, use Deno's built-in tools:

  ```bash
  deno lint
  deno fmt
  ```

## 🤝 Contributing

Contributions are welcome! Please submit issues or pull requests.
