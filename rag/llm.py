"""Appel au LLM : API Anthropic ou modèle local via Ollama."""
from . import config


def complete(system: str, messages: list[dict], max_tokens: int = 600) -> str:
    if config.LLM_PROVIDER == "ollama":
        import requests
        r = requests.post(f"{config.OLLAMA_HOST}/api/chat", timeout=120, json={
            "model": config.LLM_MODEL, "stream": False,
            "messages": [{"role": "system", "content": system}] + messages,
            "options": {"temperature": 0}})
        r.raise_for_status()
        return r.json()["message"]["content"]

    import anthropic
    client = anthropic.Anthropic()  # lit ANTHROPIC_API_KEY dans l'environnement
    kwargs = dict(model=config.LLM_MODEL, max_tokens=max_tokens, system=system, messages=messages)
    try:
        resp = client.messages.create(temperature=0, **kwargs)
    except anthropic.BadRequestError:  # certains modèles refusent le paramètre temperature
        resp = client.messages.create(**kwargs)
    return "".join(b.text for b in resp.content if b.type == "text")
