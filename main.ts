import { type Context, Hono, type MiddlewareHandler } from "hono";
import { cors } from "hono/cors";

const PORT = 999;

interface IMessage {
  id: number;
  body: string;
}

interface IMessageRequest {
  message: string;
}

const messagesCache = new Map<string, IMessage[]>();

const MESSAGES_CACHE_KEY = `messages_cache_${new Date().getDate()}_${
  new Date().getMonth() + 1
}_${new Date().getFullYear()}`;
const cachedMessages: IMessage[] = messagesCache.get(MESSAGES_CACHE_KEY) || [];

function addNewMessage(body: string) {
  const newMessage: IMessage = { id: cachedMessages.length + 1, body };
  cachedMessages.push(newMessage);
  messagesCache.set(MESSAGES_CACHE_KEY, cachedMessages);
}

const validateMessage: MiddlewareHandler = async (
  c: Context,
  next: () => Promise<void>,
) => {
  try {
    const { message }: IMessageRequest = await c.req.json<IMessageRequest>();

    if (!message || message.trim().length === 0) {
      return c.json({
        statusCode: 400,
        error: "Bad Request",
        message: "Invalid message. Message cannot be empty.",
      }, 400);
    }

    // Attach the valid message to the context for the next handler
    c.set("message", message);

    // Proceed to the next handler
    await next();
  } catch {
    return c.json({
      statusCode: 400,
      error: "Bad Request",
      message: "Invalid JSON structure.",
    }, 400);
  }
};

const app = new Hono();

// CORS config
app.use(
  "*", // route
  cors({
    origin: "*",
  }),
);

app.get("/", (c: Context) => {
  return c.json({
    messages: cachedMessages,
  });
});

app.post("/", validateMessage, (c: Context) => {
  const message = c.get<string>("message");

  addNewMessage(message);

  return c.json({
    messages: cachedMessages,
  });
});

Deno.serve({
  port: PORT,
}, app.fetch);

console.info(`🦖 Deno server is running on port ${PORT}...`);
