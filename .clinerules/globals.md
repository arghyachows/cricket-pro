---
mcp-servers:
  - context7
  - perplexity-research
  - sequential-thinking
---

# Global Cline Rules

## Next.js Best Practices

- Use the latest stable version of Next.js for all projects.
- Structure your project using the `/app` directory for new applications (Next.js 13+), preferring server components where possible.
- Prefetch data using `getServerSideProps` or `getStaticProps` for server-side rendering and static site generation.
- Use API routes for backend logic to keep server-side code isolated from the client.
- Enable incremental static regeneration (ISR) for frequently-updated content.
- Co-locate styles with components using CSS Modules or the built-in CSS support.
- Leverage dynamic imports and React suspense for code splitting and to optimize load times.
- Only expose sensitive variables through server-side environment variables; never publish secrets in client bundles.
- Regularly audit dependencies for vulnerabilities with `npm audit` or `yarn audit`.
- Write unit and integration tests for all pages and API routes.

## Radix UI Best Practices

- Import only required Radix UI primitives and use composable components for atomic design.
- Always provide meaningful `aria-` attributes and accessible labels when using Radix UI primitives.
- Use Radix UI’s controlled and uncontrolled patterns correctly–prefer controlled components for complex state management.
- Adhere to Radix’s best accessibility practices: ensure focus management, keyboard navigation, and screen reader compatibility for every component.
- Apply custom styles using Radix’s className prop or a CSS-in-JS solution, and avoid tight coupling between Radix component logic and UI themes.
- Use predictable, semantic naming for custom styled components built on top of Radix primitives.
- Regularly consult the official documentation for Radix UI and Next.js to stay updated with breaking changes or optimization tips.

## MCP Server Usage

- Use all the following MCP servers globally: context7, perplexity-research, and sequential-thinking.
- Do not route requests to any other MCP servers, even if detected in a workspace or project setting.

## Coding Standards

- Follow consistent code formatting and naming conventions throughout every project.
- TypeScript: Prefer strict type annotations and modern ES features.
- Angular: Use reactive forms and modular components for maintainability.
- Document every major interface, component, utility, and service with summary comments.

## Documentation Requirements

- Ensure that every feature, API, or module is documented in a corresponding `docs/` subfolder.
- Update the main `README.md` with every major project change.
- Add or revise ADRs (`docs/adr/`) for significant architectural or pattern changes.

## Workflow and Collaboration

- Run all suggested code actions and refactors by Cline before opening a merge request.
- Unit tests must cover all new business logic; integration and E2E tests should be addressed as specified in the test guidelines.
- Call out important TODOs as tracked items in the appropriate project management tool.

## Communication

- Write prompts and Cline requests clearly, describing the intended outcome and context.
- Use markdown for notes, examples, and task lists to ensure clarity in team communication.

## Security and Compliance

- Review dependencies for vulnerabilities as part of every sprint's code reviews.
- Do not expose credentials or secrets in code, comments, or documentation.
