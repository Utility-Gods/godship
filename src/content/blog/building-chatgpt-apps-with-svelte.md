---
title: "Building ChatGPT Apps with Svelte 5"
excerpt: "A step-by-step guide to building custom UX widgets for ChatGPT using Svelte 5 and the Apps SDK."
publishDate: "2025-10-10"
image: "/blog/svelte-chatgpt-apps.png"
category: "Web Development"
author: "Siddharth Jain"
tags: [svelte, chatgpt, openai, mcp, ai, web-development, typescript]
---

ChatGPT launched Apps SDK few days ago on their dev day, i was following it and found it really intruiguing, so like a regular next person i started reading the docs and
its pretty sweet setup, they have an MCP server with such and such contract and eventualy they pass some data to some component and that component renders inside ChatGPT app.

However I saw they used React for the component part and as a **long time lover of svelte/kit scene** i instantly asked myself what if i could do this in svelte. I mean why not? it ultimately compiles down
to js and its all the same from there.

## So I started building a svelte widget

[Here is the github repo for the widget](https://github.com/Utility-Gods/chatgpt-apps-sdk-svelte)

The [MCP server setup](https://developers.openai.com/apps-sdk/build/mcp-server) is standard across all frameworks. This guide focuses only on the **widget component** that renders in ChatGPT.

## Project Setup

```bash
npm create vite@latest chatgpt-widget -- --template svelte-ts
cd chatgpt-widget
npm install
```

Pretty standard setup, it will just compiles to a single JS file that we will send to ChatGPT and it will render it inside an Iframe.

> The Iframe you like is going to come back into style.

## Define TypeScript Types

First things first, let's tell TypeScript what the heck `window.openai` actually is. Create an `app.d.ts` file and throw this in there:

```typescript
type DisplayMode = "inline" | "fullscreen" | "pip";
type UnknownObject = Record<string, unknown>;

interface CallToolResponse {
  content: Array<{ type: string; text: string }>;
  structuredContent?: any;
  _meta?: Record<string, any>;
}

interface OpenAIAPI<WidgetState extends UnknownObject = UnknownObject> {
  /** The data returned by your MCP tool */
  toolOutput?: any;

  /** Calls a tool on your MCP. Returns the full response. */
  callTool: (
    name: string,
    args: Record<string, unknown>
  ) => Promise<CallToolResponse>;

  /** Triggers a followup turn in the ChatGPT conversation */
  sendFollowUpMessage: (args: { prompt: string }) => Promise<void>;

  /** Opens an external link, redirects web page or mobile app */
  openExternal: (payload: { href: string }) => void;

  /** For transitioning an app from inline to fullscreen or pip */
  requestDisplayMode: (args: { mode: DisplayMode }) => Promise<{
    mode: DisplayMode; // The granted display mode (host may reject)
  }>;

  /** Persist state across widget sessions */
  setWidgetState: (state: WidgetState) => Promise<void>;
}

interface Window {
  openai?: OpenAIAPI;
}
```

These are all the methods [ChatGPT Apps SDK](https://developers.openai.com/apps-sdk/build/custom-ux) gives you to play with. Pretty neat stuff.

## Create Your Widget Component

Alright, now for the fun part. Your widget needs to do three things:

### Set Up Reactive State

```svelte
<script lang="ts">
  let toolOutput = $state<any>(null);
  let isLoading = $state(true);
</script>
```

### Listen for Data from ChatGPT

ChatGPT sends data via the `openai:set_globals` event. Use `onMount` to set up the listener:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';

  const SET_GLOBALS_EVENT_TYPE = 'openai:set_globals';

  onMount(() => {
    // Check for initial data
    const updateToolOutput = () => {
      if (typeof window !== 'undefined' && window.openai?.toolOutput) {
        toolOutput = window.openai.toolOutput;
        isLoading = false;
      }
    };

    updateToolOutput(); // Run immediately

    // Listen for future updates
    const handleSetGlobal = (event: CustomEvent) => {
      const value = event.detail?.globals?.toolOutput;
      if (value !== undefined) {
        toolOutput = value;
        isLoading = false;
      }
    };

    window.addEventListener(SET_GLOBALS_EVENT_TYPE, handleSetGlobal as EventListener);

    // Cleanup on unmount
    return () => {
      window.removeEventListener(SET_GLOBALS_EVENT_TYPE, handleSetGlobal as EventListener);
    };
  });
</script>
```

## Render the Data

Now just slap your data into the template:

```svelte
{#if isLoading}
  <div class="loading">
    <p>Loading...</p>
  </div>
{:else if toolOutput?.type === 'hotel_search'}
  {@const hotels = toolOutput.hotels}
  {@const filters = toolOutput.searchFilters}

  <div class="container">
    <h2>Hotels in {filters.location}</h2>

    {#each hotels as hotel}
      <div class="hotel-card">
        <h3>{hotel.name}</h3>
        <p>{hotel.description}</p>
        <div class="rating">{hotel.guestRating}/10</div>
      </div>
    {/each}
  </div>
{/if}
```

## Using the window.openai API

Your widget isn't just sitting there looking pretty - it can actually talk back to ChatGPT. Here's what you can do:

### Trigger Follow-up Conversations

```svelte
<script lang="ts">
  async function handleHotelSelect(hotel: Hotel) {
    await window.openai?.sendFollowUpMessage({
      prompt: `Search for rooms at ${hotel.name} (ID: ${hotel.id})`
    });
  }
</script>
```

This sends a message to ChatGPT, which then figures out what to do next. Like when user clicks a hotel, you tell ChatGPT "hey, search for rooms in this hotel" and it handles the rest.

### Call Tools Directly

```svelte
async function refreshData() {
  const response = await window.openai?.callTool('searchHotels', {
    location: 'Cape Town',
    checkIn: '2025-10-15',
    checkOut: '2025-10-17',
    guests: 2
  });
  // You get back: { content, structuredContent, _meta }
  toolOutput = response.structuredContent; // Update your UI
}
```

This one's different - it directly calls your MCP tool and gives you the response back. No conversation, just straight data fetch. Useful for refresh buttons and stuff.

### Other Neat Tricks

```svelte
// Open external links (booking pages, etc)
window.openai?.openExternal({ href: 'https://booking.com/...' });

// Go fullscreen (ChatGPT may say no though)
const result = await window.openai?.requestDisplayMode({ mode: 'fullscreen' });

// Save state across sessions
await window.openai?.setWidgetState({ lastSearch: filters });
```

## The Server Side (Quick Version)

On the [MCP server](https://developers.openai.com/apps-sdk/build/mcp-server) side, your tool handler returns three things:

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  return {
    content: [{ type: "text", text: "Found 4 hotels in Cape Town" }], // For the LLM
    structuredContent: {
      // For your widget
      type: "hotel_search",
      hotels: hotels, // Import from ../src/data/hotels.ts
      searchFilters: { location, checkIn, checkOut, guests },
    },
    _meta: {
      "openai/outputTemplate": "ui://widget/hotels.html", // Which widget to render
    },
  };
});
```

**Pro tip:** We actually import the same `hotels` data that the widget uses for fallback. No duplication, one source of truth. Check our [server code](https://github.com/Utility-Gods/chatgpt-apps-sdk-svelte/blob/main/server/src/server.ts) to see how.

## Build and Integrate

When you're ready, build the widget:

```bash
npm run build
```

This creates `dist/widget.js` and `dist/widget.css`. Your MCP server reads these and inlines them in the HTML response:

```typescript
const widgetScript = readFileSync("./dist/widget.js", "utf8");
const widgetCSS = readFileSync("./dist/widget.css", "utf8");

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  return {
    contents: [
      {
        uri: "ui://widget/hotels.html",
        mimeType: "text/html+skybridge",
        text: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>${widgetCSS}</style>
          </head>
          <body>
            <div id="app"></div>
            <script type="module">${widgetScript}</script>
          </body>
        </html>
      `,
      },
    ],
  };
});
```

ChatGPT requests this HTML when it needs to render your widget, and boom - your Svelte app loads in the iframe.

## Complete Example

The full code is on [GitHub](https://github.com/Utility-Gods/chatgpt-apps-sdk-svelte) if you want to see it all together. Here's the simplified version:

The timestamp in both the HTML and as a comment in the script ensures every response is unique. ChatGPT can't cache what's always changing.

---

## Gotchas We Hit

### One Widget for Multiple Tools

should be possible to have widget per tool/tempalte. But for he demonstation purpos we are bundling evetything toghether.

```svelte
{#if toolOutput?.type === 'hotel_search'}
  <HotelSearch data={toolOutput} />
{:else if toolOutput?.type === 'room_search'}
  <RoomSearch data={toolOutput} />
{/if}
```


### Widget Loading and Updates

ChatGPT calls `ReadResource` for your widget URI only once when the app initializes. After that, it caches the widget HTML.

This means if you rebuild your widget (`yarn build`), ChatGPT won't fetch the new version - it already has it. The only way to get updates is to **delete and recreate the app** in ChatGPT settings.

We tried cache headers, random URIs, timestamps - none of it mattered. ChatGPT loads your widget once per app lifetime, period. Plan your dev workflow accordingly.

### Data Structure Mismatch, moving fast breaking stuff

The docs show `toolOutput` should contain your `structuredContent` directly, but ChatGPT actually wraps it in a `result` object when sending through events. Handle both formats:

```svelte
const handleSetGlobal = (event: CustomEvent) => {
  const value = event.detail?.globals?.toolOutput;
  if (value?.result?.structuredContent) {
    toolOutput = value.result.structuredContent; // Actual format
  } else {
    toolOutput = value; // Docs format
  }
};
```

### Use Cloudflare Tunnel, Not ngrok

When testing your MCP server with ChatGPT, use [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) instead of ngrok. It's free, doesn't timeout, and gives you stable URLs:

```bash
# Quick start
cloudflared tunnel --url http://localhost:3000
```

You get a URL like `https://random-words.trycloudflare.com` that stays up as long as your tunnel runs. No session limits, no random disconnects. Plus you can monitor traffic through the Cloudflare dashboard.

---

## That's It

Svelte works great for ChatGPT widgets. The compiled output is tiny, the code is clean, and you don't need to learn React if you already know Svelte.

The [full working example is on GitHub](https://github.com/Utility-Gods/chatgpt-apps-sdk-svelte) - clone it, mess with it, build something cool.

## Demo Screenshots

Here's what it looks like running in ChatGPT:

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin: 2rem 0;">
  <img src="/blog/chatgpt-widget-demo-1.png" alt="Hotel search widget in ChatGPT" style="width: 100%; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
  <img src="/blog/chatgpt-widget-demo-2.png" alt="Widget showing hotel details" style="width: 100%; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
  <img src="/blog/chatgpt-widget-demo-3.png" alt="Fullscreen mode demonstration" style="width: 100%; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
  <img src="/blog/chatgpt-widget-demo-4.png" alt="Interactive hotel browsing" style="width: 100%; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
</div>
