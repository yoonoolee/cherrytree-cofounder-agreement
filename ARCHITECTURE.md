# Cherrytree Agents — Architecture

The design lives outside this repo:

| Doc | Link | Access |
|-----|------|--------|
| Working Doc (Notion) | https://app.notion.com/p/3e18c9973f7b810088f9f4770da60bb7 | Notion MCP |
| Diagram (FigJam) | https://www.figma.com/board/Pu2AyvKUFCkK5q14IpzEsd/Cherrytree-Advisor-Agent-diagram | Figma MCP |

- If an MCP isn't connected or hits a limit, tell the user. Ask before falling back to the Claude in Chrome MCP.
- Ask before every edit to either doc, and wait for confirmation.
