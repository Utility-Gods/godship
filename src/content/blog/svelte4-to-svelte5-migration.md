---
title: "Migrating from Svelte 4 to Svelte 5: A Comprehensive Guide"
excerpt: "Learn how to smoothly transition your Svelte 4 applications to Svelte 5, understanding the key changes, new features, and best practices for migration."
publishDate: "2024-04-01"
image: "/blog/svelte5-migration.jpg"
category: "Tutorials"
author: "Utility Gods Team"
tags: [svelte, javascript, web-development, migration]
---

# Migrating from Svelte 4 to Svelte 5: A Comprehensive Guide

Svelte 5 brings significant improvements and changes to the framework, including the new Runes API, better TypeScript support, and enhanced performance. In this guide, we'll walk through the process of migrating your Svelte 4 application to Svelte 5.

## Key Changes in Svelte 5

### 1. Introduction of Runes

The most significant change in Svelte 5 is the introduction of Runes. Runes are special functions that replace the reactive declarations (`$:`) and stores (`$store`) from Svelte 4.

```javascript
// Svelte 4
let count = 0;
$: doubled = count * 2;

// Svelte 5
let count = $state(0);
let doubled = $derived(count * 2);
```

### 2. State Management Changes

The way we handle state has been simplified and made more explicit:

```javascript
// Svelte 4
let count = 0;
function increment() {
  count += 1;
}

// Svelte 5
let count = $state(0);
function increment() {
  count += 1; // Still works the same way
}
```

### 3. Props Declaration

Props are now declared using the `props` rune:

```javascript
// Svelte 4
export let name;
export let count = 0;

// Svelte 5
let { name, count = 0 } = $props();
```

## Migration Steps

### 1. Use the Official Migration Tool

Svelte provides an automated migration tool to help with the transition:

```bash
npx sv migrate svelte-5
```

This tool will automatically update most of your code, but manual review is recommended.

### 2. Update Dependencies

Update your `package.json`:

```json
{
  "dependencies": {
    "svelte": "^5.0.0"
  }
}
```

### 3. Update Configuration

If you're using SvelteKit, update your `svelte.config.js`:

```javascript
const config = {
  compilerOptions: {
    runes: true
  }
};
```

### 4. Convert Reactive Declarations

Replace all `$:` declarations with `$derived`:

```javascript
// Before
$: total = items.reduce((sum, item) => sum + item.price, 0);

// After
let total = $derived(items.reduce((sum, item) => sum + item.price, 0));
```

### 5. Migrate from Stores to Runes

While stores still work in Svelte 5, you can migrate to runes for simpler state management:

```javascript
// Svelte 4 - Using stores
import { writable } from 'svelte/store';
export const count = writable(0);

// In component
import { count } from './stores.js';
$: console.log($count);

// Svelte 5 - Using runes (recommended for component-local state)
let count = $state(0);
$effect(() => console.log(count));

// For shared state, continue using stores or use .svelte.js files:
// stores.svelte.js
export const count = $state({ value: 0 });

// In component
import { count } from './stores.svelte.js';
$effect(() => console.log(count.value));
```

**Note:** Existing stores continue to work in Svelte 5, but runes provide a simpler alternative for most use cases.

## Common Pitfalls and Solutions

### 1. Lifecycle Methods

Lifecycle methods like `onMount`, `onDestroy`, etc. continue to work in Svelte 5:

```javascript
// Both Svelte 4 and Svelte 5
import { onMount, onDestroy } from 'svelte';

onMount(() => {
  console.log('Component mounted');
  
  return () => {
    console.log('Cleanup on destroy');
  };
});
```

**Note:** While `$effect` exists in Svelte 5, lifecycle methods are still the recommended approach for most component lifecycle needs.

### 2. Event Handler Syntax Changes

Event handlers have a new syntax:

```javascript
<!-- Svelte 4 -->
<button on:click={handleClick}>Click me</button>
<input on:input={handleInput} />

<!-- Svelte 5 -->
<button onclick={handleClick}>Click me</button>
<input oninput={handleInput} />
```

### 3. Component Events and Dispatchers

Replace event dispatchers with callback props:

```javascript
// Svelte 4 - Child component
import { createEventDispatcher } from 'svelte';
const dispatch = createEventDispatcher();

function handleClick() {
  dispatch('clicked', { value: 'hello' });
}

// Svelte 5 - Child component
let { onclick } = $props();

function handleClick() {
  onclick?.({ value: 'hello' });
}
```

### 4. Bindable Props

Two-way binding requires explicit declaration:

```javascript
// Svelte 4 - automatic binding
export let value;

// Svelte 5 - explicit bindable
let { value = $bindable() } = $props();
```

### 5. Component Instantiation

Components are now functions, not classes:

```javascript
// Svelte 4
import Component from './Component.svelte';
const component = new Component({
  target: document.body,
  props: { name: 'world' }
});

// Svelte 5
import { mount } from 'svelte';
import Component from './Component.svelte';
const component = mount(Component, {
  target: document.body,
  props: { name: 'world' }
});
```

### 6. Slots to Snippets Migration

Slots are replaced with snippets in Svelte 5:

```javascript
<!-- Svelte 4 - Parent component -->
<Component>
  <h1 slot="header">Title</h1>
  <p>Content</p>
</Component>

<!-- Svelte 5 - Parent component -->
<Component>
  {#snippet header()}
    <h1>Title</h1>
  {/snippet}
  {#snippet children()}
    <p>Content</p>
  {/snippet}
</Component>

<!-- Svelte 5 - Child component -->
<script>
  let { header, children } = $props();
</script>

<header>
  {@render header()}
</header>
<main>
  {@render children()}
</main>
```

## Testing Your Migration

Test these key areas after migration:

- Props destructuring with `$props()`
- Event handlers (`onclick` vs `on:click`)
- Component communication via callback props
- Snippets replacing slots

## Conclusion

Svelte 5 brings runes for explicit reactivity and performance improvements. Use `npx sv migrate svelte-5` to automate most changes, then test thoroughly.

Benefits: smaller bundles, better performance, clearer reactivity model.

## Resources

- [Official Svelte 5 Documentation](https://svelte.dev/docs)
- [Svelte 5 Migration Guide](https://svelte.dev/docs/migration)
- [Svelte Discord Community](https://discord.gg/svelte) 