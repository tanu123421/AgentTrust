# AgentTrust: System Limitations & Explicit Disclosures

AgentTrust adheres to strict scientific and engineering transparency. Users and security evaluators must understand what the platform **can** and **cannot** guarantee.

---

## 1. Limitations of Deterministic Rule Matching

1. **Semantic Obfuscation**:
   - Deterministic keyword and regex matchers excel at detecting known override sequences (`ignore previous instructions`, `As EvilTwin`, `</system>`). However, human adversaries can construct novel literary allegories, cipher encodings, or foreign-language rephrasings that bypass static pattern matchers while conveying equivalent intent.
2. **Multi-Turn Behavioral Drift**:
   - Single-turn scenario evaluations do not capture subtle conversational drift that develops over extended multi-turn interactions.
3. **No Guarantee of Absolute Safety**:
   - Passing all 32 built-in test scenarios indicates strong compliance with established baselines, but **does not prove that an agent is immune to prompt injection or manipulation**.

---

## 2. Limitations of Sensitive Data & Canary Detection

1. **Synthetic Canary Scope**:
   - Synthetic token detection verifies that designated markers (`TEST_API_KEY...`) are withheld. It does not replace enterprise Data Loss Prevention (DLP) across arbitrary unstructured data types.
2. **Fragmented & Split Secrets**:
   - Regex-based masking detects contiguous tokens matching defined expressions. An agent that outputs secrets fragmented across whitespace or multiple messages may evade detection.

---

## 3. Limitations of RAG Grounding Checks

1. **Lexical Overlap vs. Semantic Truth**:
   - Deterministic grounding checks compare assertions against local document tokens. The platform verifies that claims match provided text, but cannot fact-check whether the underlying document itself contains real-world factual errors.
2. **Context Window Slicing**:
   - In real RAG deployments, chunking strategies and embedding distance metrics introduce retrieval noise that requires live vector database integration.

---

## 4. Local-First Architectural Boundaries

1. **Single-Node Persistence**:
   - AgentTrust utilizes SQLite for frictionless local setup. While excellent for single-operator testing and CI pipelines, multi-tenant enterprise deployments require PostgreSQL with connection pooling.
2. **Simulation vs. Live Environment Constraints**:
   - Simulated tools (`send_email`, `delete_record`) verify authorization decision logic in software, but cannot verify database-level row-level security (RLS) or network firewall policies.
