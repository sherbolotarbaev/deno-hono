// import { type Context, Hono } from "hono";
// import { cors } from "hono/cors";
// import { logger } from "hono/logger";
// import { secureHeaders } from "hono/secure-headers";
// import { z } from "zod";
// import { zValidator } from "@hono/zod-validator";

// const PORT = 999;

// interface IMessage {
//   id: number;
//   body: string;
//   createdAt: Date;
//   updatedAt: Date;
// }

// const cacheDate = `${new Date().getDate()}_${new Date().getMonth() + 1}_${
//   new Date().getFullYear()
// }`;
// const messagesCache = new Map<string, IMessage[]>();

// const MESSAGES_CACHE_KEY = `messages_cache_${cacheDate}`;
// const cachedMessages: IMessage[] = messagesCache.get(MESSAGES_CACHE_KEY) || [];

// function addNewMessage(body: string): IMessage {
//   const newMessage: IMessage = {
//     id: cachedMessages.length + 1,
//     body,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   };
//   cachedMessages.push(newMessage);
//   messagesCache.set(MESSAGES_CACHE_KEY, cachedMessages);
//   return newMessage;
// }

// function updateMessage(id: number, body: string): IMessage | null {
//   const messageIndex = cachedMessages.findIndex((msg) => msg.id === id);
//   if (messageIndex === -1) return null;

//   cachedMessages[messageIndex].body = body;
//   cachedMessages[messageIndex].updatedAt = new Date();
//   messagesCache.set(MESSAGES_CACHE_KEY, cachedMessages);
//   return cachedMessages[messageIndex];
// }

// // Validation schema
// const messageSchema = z.object({
//   message: z.string({
//     required_error: "Message is required.",
//     invalid_type_error: "Message must be a string.",
//   }).min(1, "Message must be at least 1 character long.").max(
//     280,
//     "Message must be 280 characters or less.",
//   ),
// });

// const app = new Hono();

// // Middleware
// app.use("*", logger());
// app.use("*", secureHeaders());
// app.use(
//   "*",
//   cors({
//     origin: "*",
//     allowMethods: ["GET", "POST", "PUT", "DELETE"],
//   }),
// );

// app.onError((_err: unknown, c: Context) => {
//   return c.json({
//     statusCode: 500,
//     error: "Internal Server Error",
//     message: "An unexpected error occurred.",
//   }, 500);
// });

// app.get("/", (c: Context) => {
//   return c.json({
//     cacheDate,
//     totalCount: cachedMessages.length,
//     items: cachedMessages,
//   });
// });

// app.post(
//   "/",
//   zValidator("json", messageSchema, (result, c) => {
//     if (!result.success) {
//       const zodError = result.error;
//       return c.json({
//         statusCode: 400,
//         error: "Bad Request",
//         messages: zodError.issues.map((issue) => issue.message),
//       }, 400);
//     }
//   }),
//   (c: Context) => {
//     const { message } = c.req.valid("json");
//     const newMessage = addNewMessage(message);

//     return c.json({
//       item: newMessage,
//     });
//   },
// );

// app.put(
//   "/:id",
//   zValidator("json", messageSchema, (result, c) => {
//     if (!result.success) {
//       const zodError = result.error;
//       return c.json({
//         statusCode: 400,
//         error: "Bad Request",
//         messages: zodError.issues.map((issue) => issue.message),
//       }, 400);
//     }
//   }),
//   (c: Context) => {
//     const id = Number(c.req.param("id"));
//     const { message } = c.req.valid("json");
//     const updatedMessage = updateMessage(id, message);

//     if (!updatedMessage) {
//       return c.json({
//         statusCode: 404,
//         error: "Not Found",
//         message: `Message with ID ${id} not found.`,
//       }, 404);
//     }

//     return c.json({
//       item: updatedMessage,
//     });
//   },
// );

// app.delete("/:id", (c: Context) => {
//   const id = Number(c.req.param("id"));
//   const messageIndex = cachedMessages.findIndex((msg) => msg.id === id);

//   if (messageIndex === -1) {
//     return c.json({
//       statusCode: 404,
//       error: "Not Found",
//       message: `Message with ID ${id} not found.`,
//     }, 404);
//   }

//   cachedMessages.splice(messageIndex, 1);
//   messagesCache.set(MESSAGES_CACHE_KEY, cachedMessages);

//   return c.json({
//     message: `Message with ID ${id} deleted successfully.`,
//     totalCount: cachedMessages.length,
//     items: cachedMessages,
//   });
// });

// app.delete("/", (c: Context) => {
//   cachedMessages.length = 0;
//   messagesCache.set(MESSAGES_CACHE_KEY, cachedMessages);

//   return c.json({
//     message: "All messages deleted successfully.",
//   });
// });

// Deno.serve({
//   port: PORT,
// }, app.fetch);

// console.info(`🦖 Deno server is running on port ${PORT}...`);



// BLOG API:

import { type Context, Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";

const PORT = 999;

// Define the core data model for blog views
interface IBlogView {
  slug: string;
  count: number;
  lastViewed: Date;
}

// In-memory store for views
const viewsCache = new Map<string, IBlogView>();

// Helper function to get or create a blog view
function getOrCreateBlogView(slug: string): IBlogView {
  if (!viewsCache.has(slug)) {
    viewsCache.set(slug, {
      slug,
      count: 0,
      lastViewed: new Date(0), // Initialize with epoch time
    });
  }
  return viewsCache.get(slug)!;
}

// Helper function to increment view count
function incrementViewCount(slug: string): IBlogView {
  const view = getOrCreateBlogView(slug);
  view.count++;
  view.lastViewed = new Date();
  return view;
}

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", secureHeaders());
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET"],
  }),
);

// Error handling
app.onError((err: unknown, c: Context) => {
  console.error(err);
  return c.json({
    statusCode: 500,
    error: "Internal Server Error",
    message: "An unexpected error occurred.",
  }, 500);
});

// Single endpoint to increment and retrieve a blog post's view data
app.get("/views/:slug", (c: Context) => {
  const slug = c.req.param("slug");
  
  if (!slug) {
    return c.json({
      statusCode: 400,
      error: "Bad Request",
      message: "Slug is required.",
    }, 400);
  }

  const updatedView = incrementViewCount(slug);

  return c.json({
    slug: updatedView.slug,
    count: updatedView.count,
    lastViewed: updatedView.lastViewed,
  });
});

// Start the server
Deno.serve({
  port: PORT,
}, app.fetch);

console.info(`🦖 Deno server is running on port ${PORT}...`);
