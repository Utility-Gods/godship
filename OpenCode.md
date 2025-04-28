# OpenCode.md - Utility Gods Godship Project

## Build Commands
- `npm run dev` or `pnpm run dev` - Start development server
- `npm run build` or `pnpm run build` - Build for production
- `npm run preview` or `pnpm run preview` - Preview production build

## Code Style Guidelines
- **Imports**: Use absolute imports with aliases (@components, @layouts, @utils, @assets)
- **Component Structure**: Astro components use frontmatter (---) for imports and scripts
- **Formatting**: Use 2-space indentation, trailing commas in objects/arrays
- **Naming**: PascalCase for components, camelCase for variables/functions
- **CSS**: Use Tailwind classes with consistent ordering (layout → spacing → typography → colors)
- **Types**: Use TypeScript interfaces for props, enable strictNullChecks
- **Error Handling**: Use try/catch blocks for async operations
- **Icons**: Use astro-icon component with consistent sizing
- **Fonts**: Montserrat for headings, Roboto for body text
- **Responsive Design**: Mobile-first approach with sm/md/lg/xl breakpoints