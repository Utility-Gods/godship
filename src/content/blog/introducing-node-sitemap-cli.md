---
title: "Introducing node-sitemap-cli: A Flexible Sitemap Generator for Node.js Projects"
excerpt: "Discover node-sitemap-cli, an easy-to-use tool for generating sitemaps in Node.js projects. Learn how this flexible generator can help improve your site's SEO and crawlability."
publishDate: "2024-04-01"
image:  "/blog/node-sitemap-cli.jpg"
category: "Tools"
author: "Utility Gods Team"
tags: [nodejs, seo, tools, opensource]
---

Are you looking for a simple yet powerful way to generate sitemaps for your Node.js projects? Meet `node-sitemap-cli`, a flexible sitemap generator that makes the process straightforward and efficient.

## What is node-sitemap-cli?

`node-sitemap-cli` is an open-source tool built to help developers automatically generate sitemaps for their web applications. Using node-html-parser under the hood, it provides a command-line interface that makes sitemap generation accessible to everyone, from beginners to experienced developers.

## Key Features

- **Easy Installation**: Available through npm as a global or local package
- **Flexible Configuration**: Customizable options for baseUrl, output directory, and crawl depth
- **Command-line Interface**: Simple commands for generating sitemaps with custom parameters
- **Modern Node.js Support**: Built for Node.js 14.x and later versions

## Getting Started

### Global Installation

```bash
npm install -g node-sitemap-cli
```

Once installed globally, you can generate a sitemap using:

```bash
generate-sitemap
```

### Local Project Installation

For project-specific usage:

```bash
npm install node-sitemap-cli
```

Add it to your `package.json` scripts:

```json
{
  "scripts": {
    "generate-sitemap": "generate-sitemap"
  }
}
```

## Customization Options

The tool comes with several configuration options to suit your needs:

- **baseUrl**: Define your starting URL (default: 'http://localhost:3000')
- **outDir**: Specify output directory for the sitemap (default: './public')
- **maxDepth**: Set maximum crawl depth (default: 3)

Example with custom options:

```bash
generate-sitemap baseUrl=https://your-site.com outDir=./public maxDepth=5
```

## Best Practices and Considerations

1. **Development Environment**:
   - Start your local server before generation
   - Use appropriate localhost URL and port
   - Example: `generate-sitemap baseUrl=http://localhost:3000`

2. **Production Usage**:
   - Use your live website URL as baseUrl
   - Ensure the site is accessible during generation
   - Consider sitemap size for large websites

## Limitations to Keep in Mind

- Cannot crawl pages requiring authentication
- May not include JavaScript-rendered content
- Large sites might need optimization or multiple sitemap files

## Why Choose node-sitemap-cli?

1. **Simplicity**: Easy to install and use with minimal configuration
2. **Flexibility**: Customizable options for different project needs
3. **Modern**: Built with current Node.js practices in mind
4. **Open Source**: MIT licensed and open for community contributions

## Getting Involved

The project is open source and welcomes contributions from the community. Whether it's bug fixes, feature additions, or documentation improvements, your input is valuable.

## Conclusion

`node-sitemap-cli` offers a straightforward solution for generating sitemaps in Node.js projects. Its combination of simplicity and flexibility makes it a valuable tool for developers looking to improve their site's SEO and crawlability.

Ready to try it out? Head over to [node-sitemap-cli on GitHub](https://github.com/Utility-Gods/node-sitemap-cli) to get started! 