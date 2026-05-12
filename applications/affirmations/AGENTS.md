# Affirmations Application

Python application that generates structured affirmations for spiritual practices (tarot, astrology, chakras, kabbalah, runes, lenormand, and more) using LangChain, LangGraph, and a local Ollama LLM. Features a LangGraph ReAct agent with a SearxNG metasearch tool (aggregating Wikipedia and 135+ engines), plus a Trafilatura-powered research processing layer. Output is structured JSON organized by practice.

## Architecture

- **LLM**: `ChatOllama` → `gemma4:e2b` — configured in the notebook
- **Chains**: LCEL pipe syntax (`ChatPromptTemplate | llm.with_structured_output(Affirmation)`)
- **Agent**: LangGraph `create_react_agent` with research tools
- **Research tools**: SearxNG self-hosted (aggregates Wikipedia, DuckDuckGo, Google Scholar, ArXiv, and more)
- **Research processing**: Trafilatura HTML extraction → relevance truncation → deduplication → context budgeting
- **Output**: Pydantic-validated JSON files in `output/{practice}.json`

## Project Structure

```text
applications/affirmations/
├── src/
│   ├── __init__.py          # Package marker
│   ├── affirmations.ipynb   # Main Jupyter notebook pipeline
│   ├── grammars.py          # Grammar enums (Mood, Voice, Tense, etc.) and Grammar model
│   ├── models.py            # Pydantic models (Affirmation, SubjectAffirmations, etc.)
│   ├── output.py            # JSON/Markdown file I/O utilities
│   ├── prompts.py           # LangChain prompt templates
│   └── subjects.py          # Spiritual subject configuration (Subject, SubjectCategory)
├── testing/
│   ├── __init__.py
│   ├── test_grammars.py
│   ├── test_models.py
│   ├── test_output.py
│   ├── test_prompts.py
│   └── test_subjects.py
├── output/
│   └── .gitkeep
├── AGENTS.md
├── pyproject.toml
├── uv.lock
├── searxng.settings.yml
└── README.md
```

## Key Commands

```bash
# Lint, format, typecheck, test
nx run affirmations:lint               # ruff-lint via targetDefault
nx run affirmations:format             # ruff-format via targetDefault
nx run affirmations:typecheck          # pyright + ty (parallel)
nx run affirmations:test               # all tests via pytest targetDefault
nx run affirmations:test:unit          # only unit tests
nx run affirmations:test:integration   # only integration tests
nx run affirmations:test:coverage      # all tests + coverage report
nx run affirmations:vulture            # dead code detection via targetDefault
nx run affirmations:ty                 # ty type checker (standalone)
nx run affirmations:bandit             # security linter

# Open browser UIs
nx run affirmations:open-webui --configuration=open
nx run affirmations:searxng --configuration=open

# Docker service management
nx run affirmations:ollama --configuration=start
nx run affirmations:ollama --configuration=stop
nx run affirmations:ollama --configuration=pull-small   # pull gemma4:e2b
nx run affirmations:searxng --configuration=start
nx run affirmations:searxng --configuration=stop
nx run affirmations:open-webui --configuration=start
nx run affirmations:open-webui --configuration=stop
```

## Conventions

- Python ≥ 3.11, managed with `uv` (`pyproject.toml` + `uv.lock`)
- **Tool targets are inherited from `nx.json` targetDefaults** — `ruff-format`, `ruff-lint`, `pyright`, `pytest`, `vulture`, `ty`, and `bandit` all resolve to monorepo-wide defaults. Project-level targets (`format`, `lint`, `typecheck`, `test`) are thin composite overrides that delegate to these sub-targets.
- Ruff for linting and formatting — `nx run affirmations:lint` / `nx run affirmations:format`
- pyright strict mode as primary type checker — `nx run affirmations:pyright`
- ty as supplementary type checker (pre-1.0, project-level config in `pyproject.toml`) — `nx run affirmations:ty`
- bandit for security analysis — `nx run affirmations:bandit`
- Vulture for dead code detection — `nx run affirmations:vulture`
- pytest for tests, located in `testing/`, named `test_*_unit.py` or `test_*_integration.py`
- All Pydantic models use `model_dump_json(indent=2)` for JSON serialization
- Tool outputs always pass through the research processing layer (`research.py`)
- No API keys required for core functionality (Ollama is local, Wikipedia/SearxNG are keyless)

## Environment Variables

| Variable       | Required | Description                                           |
| -------------- | -------- | ----------------------------------------------------- |
| `OLLAMA_HOST`  | No       | Ollama server URL (default: `http://localhost:11434`) |
| `SEARXNG_HOST` | No       | SearxNG server URL (default: `http://localhost:8889`) |

## Services

| Service    | URL                      | Description                                  |
| ---------- | ------------------------ | -------------------------------------------- |
| Ollama     | `http://localhost:11434` | Local LLM server (`gemma4:e2b`)              |
| Open WebUI | `http://localhost:3001`  | Browser-based Ollama chat interface          |
| SearxNG    | `http://localhost:8889`  | Self-hosted metasearch engine (135+ engines) |
