---
title: "Mastering HTMX Partial Swaps: Building Dynamic UIs with Hypermedia"
excerpt: "Explore HTMX's hx-swap-oob attribute for partial page updates, creating smooth user experiences while maintaining hypermedia principles"
publishDate: "2025-07-26"
image: "/blog/htmx-swap.png"
category: "Web Development"
author: "Siddharth"
tags: ["htmx", "hypermedia", "web development", "javascript"]
---

Modern web applications demand dynamic, responsive interfaces that update seamlessly without full page reloads. While single-page applications (SPAs) solve this with complex client-side state management, HTMX offers a hypermedia-driven alternative through **partial swaps** that maintains simplicity while delivering rich user experiences.

## What Are Partial Swaps?

Partial swaps allow you to update multiple parts of your page from a single server response. Instead of replacing just the target element, you can update additional elements anywhere on the page using the `hx-swap-oob` (out-of-band) attribute.

Think of it as the server having the ability to say: "Here's your main content update, but also update that notification counter, close that modal, and show a success toast."

## The Problem: Traditional Form Submissions

Consider a typical product creation form. With traditional approaches, you face this dilemma:

```html
<!-- Option 1: Full page reload (jarring) -->
<form action="/products" method="post">
  <!-- Lost: scroll position, form state -->
</form>

<!-- Option 2: SPA approach (complex) -->
<form onsubmit="handleSubmit(event)">
  <!-- Requires: state management, error handling, loading states -->
</form>
```

## The HTMX Solution: Out-of-Band Swaps

HTMX's `hx-swap-oob` attribute lets the server orchestrate multiple DOM updates in a single response:

```html
<form hx-post="/api/products/create" 
      hx-target="#main-content" 
      hx-swap="innerHTML"
      hx-push-url="/products">
  <input name="name" placeholder="Product name" required />
  <input name="price" type="number" placeholder="Price" required />
  <button type="submit">Create Product</button>
</form>
```

When this form submits, the server can return:

```html
<!-- Main content update -->
<div class="products-grid">
  <!-- Updated product list with new item highlighted -->
  <div class="product-card animate-highlight">
    <h3>New Product</h3>
    <p>$99.99</p>
  </div>
  <!-- Other products... -->
</div>

<!-- Out-of-band updates -->
<div hx-swap-oob="beforeend:#toast-container">
  <div class="toast toast-success">
    Product created successfully!
  </div>
</div>

<div hx-swap-oob="innerHTML:#product-count">
  <span>15 products</span>
</div>

<div hx-swap-oob="delete:#product-modal"></div>
```

## Real-World Pattern: Form Success with State Updates

Here's a comprehensive pattern that demonstrates the power of partial swaps:

### Server-Side Template (Go/Templ)

```go
templ ProductCreatedWithList(newProduct Product, allProducts []Product) {
    <!-- Success toast -->
    <div hx-swap-oob="beforeend:#toast-container">
        @ui.SuccessToast("Product created successfully!")
    </div>
    
    <!-- Updated product list with highlighting -->
    <div hx-swap-oob="innerHTML:#product-list">
        @ProductList(allProducts, newProduct.ID)
    </div>
    
    <!-- Update product counter -->
    <div hx-swap-oob="innerHTML:#product-count">
        <span>{len(allProducts)} products</span>
    </div>
    
    <!-- Close modal -->
    <div hx-swap-oob="delete:#modal"></div>
    
    <!-- Update navigation breadcrumb -->
    <div hx-swap-oob="innerHTML:#breadcrumb">
        <a href="/products">Products</a> 
        <span>({len(allProducts)} total)</span>
    </div>
}
```

### The Handler Pattern

```go
func CreateProductHandler(c echo.Context) error {
    // Process form data
    product := Product{
        Name:  c.FormValue("name"),
        Price: parsePrice(c.FormValue("price")),
    }
    
    // Save to database
    if err := db.Save(&product); err != nil {
        // Error response with OOB error toast
        c.Response().Header().Set("HX-Reswap", "none")
        c.Response().Header().Set("HX-Push-Url", "false")
        return ErrorToast("Failed to create product").Render(ctx, c.Response().Writer)
    }
    
    // Success: get updated product list
    allProducts := db.GetAllProducts()
    
    // Return full page content with OOB updates
    return ProductCreatedWithList(product, allProducts).Render(ctx, c.Response().Writer)
}
```

## Advanced Patterns

### 1. Image Upload with Multiple Updates

```javascript
// Client-side upload trigger
window.uploadProductImage = function(input) {
    const files = input.files;
    if (files.length === 0) return;
    
    // Show loading indicator
    showLoadingIndicator(`Uploading ${files.length} image(s)...`);
    
    // Submit via HTMX
    htmx.ajax('POST', '/api/products/add-image', {
        source: createFormWithFiles(files),
        target: '#product-details',
        swap: 'innerHTML'
    });
};
```

Server response updates multiple areas:

```html
<!-- Main product view -->
<div class="product-details">
  <div class="image-gallery">
    <!-- Updated with new images -->
  </div>
</div>

<!-- Success toast -->
<div hx-swap-oob="beforeend:#toast-container">
  <div class="toast toast-success">3 images uploaded successfully!</div>
</div>

<!-- Update image counter in sidebar -->
<div hx-swap-oob="innerHTML:#image-count">
  <span>12 images</span>
</div>
```

### 2. Search with Live Results and Filters

```html
<input hx-get="/products/search"
       hx-trigger="input changed delay:300ms"
       hx-target="#search-results" 
       hx-include="[data-search-param]"
       name="q" />

<select hx-get="/products/search"
        hx-trigger="change"
        hx-target="#search-results"
        hx-include="[data-search-param]"
        name="category"
        data-search-param>
  <option value="">All Categories</option>
  <option value="electronics">Electronics</option>
</select>
```

Search response updates results and metadata:

```html
<!-- Search results -->
<div class="search-results">
  <div class="product-grid">
    <!-- Filtered products -->
  </div>
</div>

<!-- Update result count -->
<div hx-swap-oob="innerHTML:#result-count">
  Found 23 products
</div>

<!-- Update filter indicators -->
<div hx-swap-oob="innerHTML:#active-filters">
  <span class="filter-tag">Electronics <button>×</button></span>
</div>
```

## Error Handling with Partial Swaps

HTMX can handle errors gracefully using OOB swaps while keeping the main UI intact:

```go
func HandleError(c echo.Context, message string) error {
    // Prevent main content swap, keep form visible
    c.Response().Header().Set("HX-Reswap", "none")
    c.Response().Header().Set("HX-Push-Url", "false")
    
    // Return only error toast via OOB
    return ErrorResponse{
        Template: `<div hx-swap-oob="beforeend:#toast-container">
                     @ui.ErrorToast("` + message + `")
                   </div>`,
    }.Render(ctx, c.Response().Writer)
}
```

This pattern provides optimal UX:
- **Success**: Navigate to updated list with success feedback
- **Error**: Keep form open for immediate retry with error feedback

## Benefits of Partial Swaps

1. **Server-Controlled State**: No client-side state synchronization
2. **Progressive Enhancement**: Works without JavaScript
3. **Reduced Complexity**: No need for complex state management libraries
4. **Better UX**: Smooth updates without full page reloads
5. **SEO Friendly**: Content is server-rendered
6. **Accessibility**: Maintains semantic HTML structure

## Best Practices

### 1. Use Explicit Targets
Always specify where updates should go:

```html
<!-- ✅ Good: Explicit targeting -->
<form hx-post="/api/action" hx-target="#results">
  <div id="results"></div>
</form>

<!-- ❌ Bad: Form replaces itself -->
<form hx-post="/api/action">
  <!-- Form disappears on response -->
</form>
```

### 2. Leverage OOB for Toast Notifications

Create a global toast system:

```html
<!-- In your layout -->
<div id="toast-container" class="fixed top-4 right-4 z-50"></div>
```

```go
// Server template utility
templ SuccessToast(message string) {
    <div hx-swap-oob="beforeend:#toast-container">
        <div class="toast toast-success animate-slide-in">
            {message}
            <button onclick="this.parentElement.remove()">×</button>
        </div>
    </div>
}
```

### 3. Handle 4xx Errors for OOB Swaps

```javascript
// Allow 4xx responses to swap content for error handling
document.addEventListener("htmx:beforeOnLoad", function(evt) {
    if (evt.detail.xhr.status >= 400 && evt.detail.xhr.status < 500) {
        evt.detail.shouldSwap = true;
        evt.detail.isError = false;
    }
});
```

## Real-World Implementation

These HTMX partial swap patterns aren't just theoretical—they're battle-tested in production applications. At [PhotoShip](https://photoship.co), we've leveraged these exact patterns to build a dynamic catalog management platform that feels smooth and responsive while maintaining the simplicity of hypermedia-driven architecture.

The catalog creation workflow, team collaboration features, and document processing all use the OOB swap patterns detailed above. Users get instant feedback through toast notifications, smooth modal interactions, and seamless page updates—all powered by server-orchestrated partial swaps.

## Conclusion

HTMX's partial swap capabilities provide a compelling alternative to complex SPA frameworks. By leveraging `hx-swap-oob`, you can build rich, interactive user interfaces that feel modern and responsive while maintaining the simplicity and reliability of server-rendered HTML.

The key insight is that the server, not the client, should orchestrate UI updates. This approach reduces complexity, improves maintainability, and provides a better developer experience while delivering excellent user experiences.

Whether you're building a simple CRUD application or a complex dashboard, partial swaps give you the tools to create dynamic interfaces without sacrificing the principles of hypermedia-driven architecture.
