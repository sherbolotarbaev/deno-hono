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
    items: cachedMessages,
  });
});

app.post("/", validateMessage, (c: Context) => {
  const message = c.get<string>("message");

  addNewMessage(message);

  return c.json({
    items: cachedMessages,
  });
});

app.delete("/:id", (c: Context) => {
  const id = Number(c.req.param("id"));
  const messageIndex = cachedMessages.findIndex((msg) => msg.id === id);

  if (messageIndex === -1) {
    return c.json({
      statusCode: 404,
      error: "Not Found",
      message: `Message with ID ${id} not found.`,
    }, 404);
  }

  cachedMessages.splice(messageIndex, 1);
  messagesCache.set(MESSAGES_CACHE_KEY, cachedMessages);

  return c.json({
    statusCode: 200,
    message: `Message with ID ${id} deleted successfully.`,
    items: cachedMessages,
  });
});

app.delete("/", (c: Context) => {
  cachedMessages.length = 0;
  messagesCache.set(MESSAGES_CACHE_KEY, cachedMessages);

  return c.json({
    statusCode: 200,
    message: "All messages deleted successfully.",
  });
});

Deno.serve({
  port: PORT,
}, app.fetch);

console.info(`🦖 Deno server is running on port ${PORT}...`);
