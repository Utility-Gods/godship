---
title: "Hypermedia Sync: What We Learned Building Real-Time UIs Without JSON"
excerpt: "We built a system that syncs 10,000 checkboxes and a collaborative drawing canvas across browsers in real-time using only HTML fragments and Server-Sent Events. Here's what we learned about hypermedia-driven synchronization."
publishDate: "2025-07-12"
image: "/blog/hypermedia.png"
category: "Experiments"
author: "Utility Gods Team"
tags: [hypermedia, sync, real-time, sse, htmx, architecture]
---

We've been pushing the limits of hypermedia-driven real-time synchronization, and the results surprised us. Our experiments sync [10,000 checkboxes](https://hypermedia.utilitygods.com/experiments/checkboxes) and a [collaborative drawing canvas](https://hypermedia.utilitygods.com/experiments/canvas-draw-sync) across multiple browser tabs instantly - no WebSockets, no JSON, just Server-Sent Events broadcasting tiny HTML snippets.

## The Core Pattern We Discovered

The breakthrough was treating browsers as "dumb terminals" that just swap HTML fragments:

```
Click → Server → HTML fragment → SSE broadcast → DOM swap everywhere
```

Instead of sending JSON data and letting clients figure out rendering, we send complete HTML from the server. Real-time updates become simple DOM replacements.

## What We Built

We built two experiments to test the limits of hypermedia sync:

### [Experiment 1: 10,000 Checkboxes](https://hypermedia.utilitygods.com/experiments/checkboxes)

Manages 10,000 checkboxes. When you click one, all other connected browsers see the change instantly. Each update broadcasts about 50 bytes of HTML - just the affected checkbox element.

### [Experiment 2: Collaborative Canvas](https://hypermedia.utilitygods.com/experiments/canvas-draw-sync)

A shared drawing canvas where multiple users draw together in real-time. Here's where it gets interesting - we're not sending canvas pixel data. Instead, we broadcast drawing commands as HTML attributes, and each browser reconstructs the drawing locally.

**Pro tip:** Open both experiments in multiple tabs/browsers and watch the magic happen.

## Key Technical Insights

### 1. Targeted Updates Are Everything

The naive approach would broadcast entire page sections. Instead, we broadcast minimal HTML for specific elements:

**For checkboxes:**
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

**For the canvas:**
```html
<!-- Canvas receives drawing commands as attributes -->
<canvas id="canvas"
        data-cmd="line"
        data-x="150"
        data-y="200"
        data-color="#ff0000">
</canvas>
```

Each drawing action broadcasts ~80 bytes containing the command and coordinates. The browser's JavaScript reads these attributes and draws on the canvas.

This scales beautifully. Whether you have 10 checkboxes or 10,000, each update is still ~50-80 bytes.

### 2. Originator Filtering Prevents Chaos

Without proper filtering, clicking a checkbox would update your own UI twice - once from your HTMX request and again from the SSE broadcast. Same problem with canvas - you'd see your drawing strokes duplicated.

We solved this by generating unique originator IDs:

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

Your browser draws immediately (optimistic update), other browsers get the SSE broadcast. Everyone stays in sync, nobody sees duplicates.

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

- **Bandwidth**: 50-80 bytes per update (checkbox or drawing stroke) vs 2KB+ for full section replacement
- **Latency**: Sub-100ms updates across browsers on decent connections
- **Memory**: Minimal client-side state (browsers are mostly stateless)
- **CPU**: Template rendering scales linearly with updates
- **Drawing Performance**: Canvas stays smooth even with 10+ concurrent users drawing

The canvas experiment was the real surprise - we expected lag with multiple people drawing, but the optimistic updates + SSE broadcast pattern keeps it feeling instant.

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

**Canvas state management**: The canvas experiment taught us that some interactions need more than just HTML attributes. We ended up with a tiny bit of JavaScript to handle drawing state - but it's way simpler than managing full client-side state in React/Vue.

**Mobile battery drain**: Persistent SSE connections impact mobile battery life more than periodic polling for some use cases. Test on actual devices before shipping.

## Try It Yourself

Check out both experiments and see hypermedia sync in action:

- **[10,000 Checkboxes](https://hypermedia.utilitygods.com/experiments/checkboxes)** - Open multiple tabs, click around, watch them stay perfectly synchronized
- **[Collaborative Canvas](https://hypermedia.utilitygods.com/experiments/canvas-draw-sync)** - Grab a friend (or just open two tabs) and draw together in real-time

The source code and architecture deep-dive are available in our [hypermedia-sync repository](https://github.com/utility-gods/hypermedia-sync).

---

*Have you experimented with hypermedia-driven real-time sync? We'd love to hear about your experiences. Reach out through our [contact page](/contact).*