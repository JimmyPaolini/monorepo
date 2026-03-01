"""Factory function for creating a configured ChatOllama instance."""

from langchain_ollama import ChatOllama


def create_llm(
    model: str = "gemma3:4b",
    base_url: str = "http://localhost:11434",
    temperature: float = 0.7,
) -> ChatOllama:
    """Create and return a configured ChatOllama instance.

    Args:
        model: The Ollama model name to use (default: gemma3:4b).
        base_url: The Ollama server URL (default: http://localhost:11434).
        temperature: Sampling temperature for generation (default: 0.7).

    Returns:
        A configured ChatOllama instance ready for use in chains or agents.
    """
    return ChatOllama(
        model=model,
        base_url=base_url,
        temperature=temperature,
    )
