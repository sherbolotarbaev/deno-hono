import { type Context, Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const PORT = 999;

interface IMessage {
  id: number;
  body: string;
  createdAt: Date;
}

const cacheDate = `${new Date().getDate()}_${new Date().getMonth() + 1}_${
  new Date().getFullYear()
}`;
const messagesCache = new Map<string, IMessage[]>();

const MESSAGES_CACHE_KEY = `messages_cache_${cacheDate}`;
const cachedMessages: IMessage[] = messagesCache.get(MESSAGES_CACHE_KEY) || [];

function addNewMessage(body: string): IMessage {
  const newMessage: IMessage = {
    id: cachedMessages.length + 1,
    body,
    createdAt: new Date(),
  };
  cachedMessages.push(newMessage);
  messagesCache.set(MESSAGES_CACHE_KEY, cachedMessages);
  return newMessage;
}

// Validation schema
const messageSchema = z.object({
  message: z.string({
    required_error: "Message is required.",
    invalid_type_error: "Message must be a string.",
  }).min(1, "Message must be at least 1 character long.").max(
    280,
    "Message must be 280 characters or less.",
  ),
});

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", secureHeaders());
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "DELETE"],
  }),
);

app.onError((_err: unknown, c: Context) => {
  return c.json({
    statusCode: 500,
    error: "Internal Server Error",
    message: "An unexpected error occurred.",
  }, 500);
});

app.get("/", (c: Context) => {
  return c.json({
    cacheDate,
    totalCount: cachedMessages.length,
    items: cachedMessages,
  });
});

app.post(
  "/",
  zValidator("json", messageSchema, (result, c) => {
    if (!result.success) {
      const zodError = result.error;
      return c.json({
        statusCode: 400,
        error: "Bad Request",
        messages: zodError.issues.map((issue) => issue.message),
      }, 400);
    }
  }),
  (c: Context) => {
    const { message } = c.req.valid("json");
    const newMessage = addNewMessage(message);

    return c.json({
      item: newMessage,
    });
  },
);

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
    message: `Message with ID ${id} deleted successfully.`,
    totalCount: cachedMessages.length,
    items: cachedMessages,
  });
});

app.delete("/", (c: Context) => {
  cachedMessages.length = 0;
  messagesCache.set(MESSAGES_CACHE_KEY, cachedMessages);

  return c.json({
    message: "All messages deleted successfully.",
  });
});

Deno.serve({
  port: PORT,
}, app.fetch);

console.info(`🦖 Deno server is running on port ${PORT}...`);
