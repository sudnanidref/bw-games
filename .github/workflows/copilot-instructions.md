# Copilot Instructions for This Workshop

## Code Style Guidance
- Keep files short and readable for workshop participants.
- Use explicit naming; avoid clever patterns.
- Include basic request validation and clear error responses.
- Favor service functions for business rules and thin route handlers.

## Testing Expectations
- Add focused Jest tests for PO business validations (especially over-allocation and status transition).
- Add Playwright coverage focused on PO pages/flow integrated with existing baseline PR data.
- Do not over-invest in test framework complexity.

## User Interface Guidelines
- Follow the existing UI patterns established in the baseline for consistency.
- Always respect the CSS variables set in the baseline for colors, spacing, and typography.
- Never use emojis in the UI or commit messages. Create a custom SVG icon if needed for visual emphasis.

## Workshop-First Principle
When there is a trade-off between production robustness and workshop clarity, choose workshop clarity.

## RTK Command Examples
Prefer RTK commands for concise repository and command output when RTK is available:

```sh
rtk ls <path>
rtk read <file>
rtk find <pattern>

rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values

rtk curl <url>          # Compact HTTP responses

rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
```

## Graphify Codebase Context
The precomputed AST knowledge graph is available at `graphify-out/graph.json`. Before searching or reading multiple source files:

1. Read `graphify-out/graph.json`.
2. Identify the relevant symbols, files, and dependency paths.
3. Read only the source files needed for the task.
4. Avoid scanning unrelated directories to locate symbols.

Use the graph for dependency tracing, call-path discovery, high-centrality modules, impact analysis, and symbol locations. Treat its edges as authoritative for structural relationships; do not infer dependencies that are absent from the graph.

