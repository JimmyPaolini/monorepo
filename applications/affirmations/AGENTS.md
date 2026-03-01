# Affirmations Application

Python application that generates structured affirmations for spiritual practices (tarot, astrology, chakras, kabbalah, runes, lenormand, and more) using LangChain, LangGraph, and a local Ollama (Gemma 3) LLM. Features a LangGraph ReAct agent with SearxNG and Wikipedia tools, plus a Trafilatura-powered research processing layer. Output is structured JSON organized by practice.

## Architecture

- **LLM**: `ChatOllama` → `gemma3:4b` running in a local Docker container
- **Chains**: LCEL pipe syntax (`ChatPromptTemplate | llm.with_structured_output(Affirmation)`)
- **Agent**: LangGraph `create_react_agent` with research tools
- **Research tools**: SearxNG self-hosted (always), Wikipedia (always)
- **Research processing**: Trafilatura HTML extraction → relevance truncation → deduplication → context budgeting
- **Output**: Pydantic-validated JSON files in `output/{practice}.json`

## Project Structure

```text
applications/affirmations/
├── src/
│   ├── __init__.py          # Package marker
│   ├── agent.py             # LangGraph ReAct agent
│   ├── chains.py            # Simple LCEL chain (no tools)
│   ├── llm.py               # ChatOllama factory
│   ├── models.py            # Pydantic models (Affirmation, AffirmationSet)
│   ├── output.py            # JSON read/write utilities
│   ├── practices.py         # Spiritual practice configuration
│   ├── research.py          # Research processing layer (Trafilatura)
│   └── tools.py             # LangChain tools (SearxNG, Wikipedia)
├── notebooks/
│   └── example-affirmation-generation.ipynb
├── testing/
│   ├── __init__.py
│   ├── test_agent_unit.py
│   ├── test_chains_unit.py
│   ├── test_models_unit.py
│   ├── test_output_unit.py
│   ├── test_practices_unit.py
│   ├── test_research_unit.py
│   └── test_tools_unit.py
├── config/
│   └── searxng/
│       └── settings.yml
├── output/
│   └── .gitkeep
├── AGENTS.md
├── pyproject.toml
├── uv.lock
└── README.md
```

## Key Commands

```bash
# Lint, format, typecheck, test
nx run affirmations:lint
nx run affirmations:format
nx run affirmations:typecheck
nx run affirmations:test              # all tests
nx run affirmations:test:unit         # only unit tests
nx run affirmations:test:integration  # only integration tests
nx run affirmations:test:coverage     # all tests + coverage report
nx run affirmations:vulture

# Open browser UIs
nx run affirmations:open-webui --configuration=open
nx run affirmations:searxng --configuration=open

# Docker service management
nx run affirmations:ollama --configuration=start
nx run affirmations:ollama --configuration=stop
nx run affirmations:ollama --configuration=pull
nx run affirmations:searxng --configuration=start
nx run affirmations:searxng --configuration=stop
nx run affirmations:open-webui --configuration=start
nx run affirmations:open-webui --configuration=stop
```

## Conventions

- Python ≥ 3.11, managed with `uv` (`pyproject.toml` + `uv.lock`)
- Ruff for linting and formatting (`uv run ruff check .` / `uv run ruff format .`)
- pyright strict mode for type checking
- Vulture for dead code detection (`uv run vulture src/ .vulture_whitelist.py --min-confidence 80`)
- pytest for tests, located in `testing/`, named `test_*_unit.py` or `test_*_integration.py`
- All Pydantic models use `model_dump_json(indent=2)` for JSON serialization
- Tool outputs always pass through the research processing layer (`research.py`)
- No API keys required for core functionality (Ollama is local, Wikipedia/SearxNG are keyless)

## Environment Variables

| Variable      | Required | Description                                           |
| ------------- | -------- | ----------------------------------------------------- |
| `OLLAMA_HOST` | No       | Ollama server URL (default: `http://localhost:11434`) |

## Services

| Service    | URL                      | Description                                                 |
| ---------- | ------------------------ | ----------------------------------------------------------- |
| Ollama     | `http://localhost:11434` | Local LLM server running Gemma 3 4B                         |
| Open WebUI | `http://localhost:3001`  | Browser-based Ollama chat interface                         |
| SearxNG    | `http://localhost:8889`  | Self-hosted metasearch engine (135+ engines)                |
| JupyterLab | `http://localhost:8888`  | Notebook interface (open `.ipynb` files directly in VSCode) |
