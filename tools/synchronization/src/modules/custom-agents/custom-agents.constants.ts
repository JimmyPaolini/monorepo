// ♟️ Constants

/** Directory containing all custom GitHub Copilot agent definition files. */
export const AGENTS_DIRECTORY = ".github/agents";

/** File path of the root AGENTS.md where the custom agents ToC is injected. */
export const AGENTS_MD_FILE = "AGENTS.md";

/** All files managed by the custom-agents sync workflow. */
export const SYNC_CUSTOM_AGENTS_FILES: string[] = [
  AGENTS_MD_FILE,
  `${AGENTS_DIRECTORY}/*.agent.md`,
];

/** Start marker comment for the custom agents table of contents in AGENTS.md. */
export const CUSTOM_AGENTS_TOC_START =
  "<!-- custom-agents-table-of-contents start -->";

/** End marker comment for the custom agents table of contents in AGENTS.md. */
export const CUSTOM_AGENTS_TOC_END =
  "<!-- custom-agents-table-of-contents end -->";
