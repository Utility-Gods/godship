---
title: "Hypermedia Sync: What We Learned Building Real-Time UIs Without JSON"
excerpt: "We built a system that syncs 10,000 checkboxes across browsers in real-time using only HTML fragments and Server-Sent Events. Here's what we learned about hypermedia-driven synchronization."
publishDate: "2025-07-12"
image: "/blog/hypermedia.png"
category: "Experiments"
author: "Utility Gods Team"
tags: [hypermedia, sync, real-time, sse, htmx, architecture]
---

We've been pushing the limits of hypermedia-driven real-time synchronization, and the results surprised us. Our latest experiment syncs [10,000 checkboxes](https://hypermedia-sync.fly.dev/) across multiple browser tabs instantly - no WebSockets, no JSON, just Server-Sent Events broadcasting tiny HTML snippets.

## The Core Pattern We Discovered

The breakthrough was treating browsers as "dumb terminals" that just swap HTML fragments:

```
Click → Server → HTML fragment → SSE broadcast → DOM swap everywhere
```

Instead of sending JSON data and letting clients figure out rendering, we send complete HTML from the server. Real-time updates become simple DOM replacements.

## What We Built

Our test application manages 10,000 checkboxes. When you click one checkbox, all other connected browsers see the change instantly. Each update broadcasts about 50 bytes of HTML - just the affected checkbox element.

[Try the live demo](https://hypermedia-sync.fly.dev/) - open it in multiple tabs and click around.

## Key Technical Insights

### 1. Targeted Updates Are Everything

The naive approach would broadcast entire page sections. Instead, we broadcast minimal HTML for specific elements:

```html
<!-- Each element listens for its specific update -->
<div id="item-1" sse-swap="item-1-updated" hx-swap="innerHTML">
  <input type="checkbox" hx-post="/toggle/1" hx-swap="none">
</div>
```

When checkbox 1 changes, we only send:
```html
<input type="checkbox" checked hx-post="/toggle/1" hx-swap="none">
```

This scales beautifully. Whether you have 10 checkboxes or 10,000, each update is still ~50 bytes.

### 2. Originator Filtering Prevents Chaos

Without proper filtering, clicking a checkbox would update your own UI twice - once from your HTMX request and again from the SSE broadcast. We solved this by generating unique originator IDs:

```go
// Return nothing to the originating browser
return c.NoContent(204)

// Broadcast to everyone else
hub.broadcast <- Event{
    Name:      "item-1-updated",
    Data:      html,
    ExcludeID: originatorID,
}
```

### 3. SSE Data Formatting Is Critical

This was our biggest gotcha. SSE requires single-line data or proper multiline formatting:

```go
// ❌ Wrong: Multiline HTML breaks SSE parsing
html := `<div>
    <p>Content</p>
</div>`

// ✅ Correct: Single line
html := `<div><p>Content</p></div>`
```

Getting this wrong causes silent failures that are painful to debug.

## Performance Characteristics

The results were better than expected:

- **Bandwidth**: 50 bytes per checkbox update (vs 2KB for full section replacement)
- **Latency**: Sub-100ms updates across browsers
- **Memory**: Minimal client-side state (browsers are stateless)
- **CPU**: Template rendering scales linearly with updates

## The Mental Model Shift

Traditional approach:
```
Action → JSON → Client Processing → DOM Updates
```

Hypermedia sync:
```
Action → HTML → Direct DOM Replacement
```

The server becomes the single source of truth for how things should look. Clients never make UI decisions - they just swap HTML.

## Real-World Application

We've since applied this pattern to production admin dashboards where teams need to see live status updates. The key insight: when UI consistency across users matters more than client-side performance, sending HTML fragments is surprisingly effective.

The 50-byte updates scale well. A typical dashboard with 20 live elements still only generates ~1KB of traffic per state change across all connected clients. Compare this to WebSocket implementations that often send full JSON payloads.

## Limitations We Hit

**SSE connection limits**: Most browsers cap SSE connections at 6 per domain. For apps needing multiple real-time streams, this becomes a constraint.

**Template rendering cost**: Every update triggers server-side template rendering. This works fine for <100 concurrent users but requires caching strategies beyond that.

**Mobile battery drain**: Persistent SSE connections impact mobile battery life more than periodic polling for some use cases.

## Try It Yourself

Check out our [10,000 checkbox experiment](https://hypermedia-sync.fly.dev/) and see hypermedia sync in action. Open multiple tabs, click around, and watch them stay perfectly synchronized.

The source code and architecture deep-dive are available in our [hypermedia-sync repository](https://github.com/utility-gods/hypermedia-sync).

---

*Have you experimented with hypermedia-driven real-time sync? We'd love to hear about your experiences. Reach out through our [contact page](/contact).*