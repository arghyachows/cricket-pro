---
mcp-servers:
  - context7
  - perplexity-research
  - sequential-thinking
---

# Global Cline Rules

## MCP Server Usage

- Use only the following MCP servers globally: context7, perplexity-research, and sequential-thinking.
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
