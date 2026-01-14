<div align="center">
  <img src="spec-icon.svg" alt="Spec Logo" width="150"/>

  # Spec

  **A Language-Agnostic Intermediate Representation for Autonomous Software Development**

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![POC Demo](https://img.shields.io/badge/Demo-Live-blue)](https://mronus.github.io/spec)
</div>

## Overview

Spec is a **programming language designed specifically for Large Language Models (LLMs)** to represent software systems. Unlike traditional programming languages designed for human developers (Python, Java) or compilers (C, Rust), Spec is optimized for **LLM comprehension, context efficiency, and autonomous agent collaboration**.

Instead of having AI agents directly generate code in specific programming languages, Spec introduces a **two-domain architecture** that separates semantic specification from implementation details.

### The Problem

Current AI-driven development tools directly generate language-specific code, creating fundamental limitations:

**1. Tight Coupling Between Design and Implementation**
- Architectural decisions are embedded in language syntax
- Changing target language requires re-generating everything from scratch
- Design intent is lost in implementation details

**2. No Separation of Concerns**
- A single agent must understand requirements AND language idioms AND frameworks AND deployment
- Expertise in product design doesn't translate to expertise in Go concurrency patterns or Java Spring configuration
- Each language needs completely separate agent training

**3. Limited Reusability**
- Generate for Java? Can't reuse for Go, Rust, or TypeScript
- Same requirements → completely different agent workflows
- No shared specification layer across implementations

**4. Verification Challenges**
- How do you verify that Java and Go implementations satisfy the same requirements?
- No formal properties or invariants to test against
- Contract between components is implicit in code, not explicit in specification

**5. Poor Traceability**
- Why was Redis chosen over PostgreSQL for sessions? (Lost in code)
- What NFRs drove the caching strategy? (Not documented)
- Which requirement led to this error handling pattern? (Unclear)
- Decision rationale disappears after code generation

**6. Parallelization Barriers**
- Can't decompose work effectively when everything is code generation
- Dependencies between code modules create serialization
- No clear boundaries for concurrent agent work

**7. Quality Inconsistency**
- LLM generates code in one shot with limited review
- Mixing concerns (business logic + language syntax + framework patterns) reduces quality
- Hard to apply specialized review (architecture review vs code review)

**8. Context Window Limitations**
- Modifying one function requires loading entire files (500+ lines)
- Enterprise systems with hundreds of classes exceed context limits
- Can't make incremental changes without full codebase context
- Token costs explode for large systems

**9. Type Safety Dilemma**
- Java: Type-safe but ceremony-heavy (imports, annotations, boilerplate)
- JavaScript: Simple but error-prone (runtime failures, unclear types)
- No LLM-optimized middle ground between strictness and simplicity

### The Solution

**Spec: The First LLM-Native Programming Language**

Traditional programming languages were designed for humans (readability, expressiveness) or compilers (static analysis, optimization). Spec is designed for **Large Language Models**—optimized for machine comprehension, context efficiency, and autonomous collaboration.

**Core Design Goals:**

1. **Context-Efficient** — Self-contained artifacts; modify one function with ~200 tokens instead of ~1,500
2. **LLM-Optimized Structure** — Consistent patterns, explicit actions, parseable without execution
3. **Type-Safe Without Brittleness** — Semantic types (Email, SecretString) without Java's ceremony
4. **Simple Without Error-Proneness** — Explicit structure without JavaScript's implicit behaviors
5. **Scalable to Enterprise Systems** — Works on 100+ microservices without context explosion
6. **Parallel by Default** — Clear boundaries enable wave-based concurrent execution

Spec introduces a **clean separation of concerns** through a two-domain architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                       SPEC DOMAIN                               │
│                  (Language-Agnostic)                            │
│                                                                 │
│  Requirements → [Specialized Agents] → Language-Agnostic IR     │
│                                                                 │
│  Product → Architect → Scrum → Developer → Tester → DevOps     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    Complete IR Specification
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  EXTERNAL AGENTS DOMAIN                         │
│                  (Language-Specific)                            │
│                                                                 │
│  IR → [Language Agents] → Production Code                      │
│                                                                 │
│  Java Agent, Go Agent, Terraform Agent, etc.                   │
└─────────────────────────────────────────────────────────────────┘
```

**Core Principle: Describe WHAT, not HOW**

Spec agents produce semantic specifications describing what the system should do. External language agents decide how to implement it in their target language.

## Key Benefits

**0. LLM-Native Design = Context Efficiency**
- ✅ **Incremental Changes**: Modify one function with minimal context (~200 tokens vs ~1,500)
- ✅ **Self-Contained Artifacts**: Each `.spec.ir` file includes everything needed
- ✅ **Explicit Dependencies**: LLMs know exactly what to load, nothing more
- ✅ **Scales to Enterprise**: Work on 100+ microservices without context explosion
- ✅ **Predictable Token Usage**: `estimated_tokens: 800` declared per artifact

**1. True Separation of Concerns**
- ✅ Product Agent: Focus purely on business requirements
- ✅ Architect Agent: Focus purely on system design decisions
- ✅ Developer Agent: Focus purely on implementation logic
- ✅ External Agents: Focus purely on language/framework expertise

**2. Flexibility Through Abstraction**
- ✅ One specification → Multiple target languages (Java, Go, Rust, TypeScript, etc.)
- ✅ One specification → Multiple frameworks (Spring, Gin, Actix, Express, etc.)
- ✅ One specification → Multiple IaC tools (Terraform, Pulumi, CloudFormation)
- ✅ Change technology stack without re-specification

**3. Parallelization at Every Level**
- ✅ Multiple Spec agents can work concurrently on different IR types
- ✅ Multiple external agents can generate code simultaneously
- ✅ Clear dependency boundaries enable wave-based execution
- ✅ Massive reduction in total generation time

**4. Formal Verification**
- ✅ Properties and invariants defined in IR
- ✅ External agents must prove they satisfy constraints
- ✅ Test specifications validate behavior, not implementation
- ✅ Cross-language verification (Java and Go satisfy same contract)

**5. Complete Traceability**
- ✅ Every decision documented with rationale (decisions.spec.ir)
- ✅ From requirement → contract → architecture → implementation
- ✅ NFRs explicitly tied to design choices
- ✅ Audit trail for compliance and review

**6. Composability**
- ✅ IR artifacts are modular and reusable
- ✅ Reference other modules via well-defined interfaces
- ✅ Incremental updates via delta/patch format (future)
- ✅ Mix and match components across systems

**7. Quality Through Specialization**
- ✅ Each agent type has specific expertise
- ✅ Multi-cycle review/feedback per artifact
- ✅ Architecture review separate from code review
- ✅ Best practices encoded in specialized agents

## Why This Matters: LLM-Native vs Traditional Languages

| Aspect | Traditional Languages | Spec IR |
|--------|----------------------|---------|
| **Designed For** | Humans & Compilers | Large Language Models |
| **Context to Modify Function** | ~1,500 tokens (entire file + deps) | ~200 tokens (self-contained) |
| **Type Safety** | Java: Too complex<br>JS: Too loose | Semantic types, no ceremony |
| **Incremental Changes** | Load entire codebase | Load single artifact |
| **Readability Goal** | Human aesthetics | LLM parsing efficiency |
| **Large System Support** | Context explosion | Modular, scales linearly |
| **Parallelization** | Limited (shared state) | Default (isolated artifacts) |
| **Primary Use Case** | Human writes → Compiler executes | LLM writes → LLM/External agent transforms |

**Example: Modifying an Authentication Function**

Traditional (Java):
```
Need to load: UserService.java + User.java + UserRepository.java +
              Session.java + Config + Framework boilerplate
Total: ~1,450 lines = ~3,000 tokens
```

Spec IR:
```spec
Need to load: authenticate.spec.ir (self-contained)
              + interface signatures (not implementations)
Total: ~150 lines = ~200 tokens
```

**Result**: 15x more context-efficient for targeted changes.

## Quick Links

- 📄 **[Read the Full Proposal](spec-language-design-proposal-v0.2.md)** - Complete design document (v0.2)
- 🚀 **[Try the Live Demo](https://mronus.github.io/spec)** - Generate IR specifications in your browser
- 💻 **[POC Documentation](poc/README.md)** - Run the proof-of-concept locally
- 📦 **[Example Outputs](examples/)** - Sample generated IR artifacts *(coming soon)*

## What is Spec IR?

Spec defines a set of IR (Intermediate Representation) types that capture the complete semantic intent of a software system:

| IR Type | Created By | Purpose |
|---------|------------|---------|
| `contract.spec.ir` | Product Agent | Entities, operations, constraints, NFRs |
| `module.spec.ir` | Architect Agent | Service decomposition and interactions |
| `infrastructure.spec.ir` | Architect Agent | Compute, network, storage, security |
| `data.spec.ir` | Architect Agent | Database schemas and migrations |
| `types.spec.ir` | Developer Agent | Shared type definitions |
| `interfaces/*.spec.ir` | Developer Agent | Component API surfaces |
| `functions/*.spec.ir` | Developer Agent | Detailed implementation logic |
| `events.spec.ir` | Developer Agent | Domain events |
| `tests.spec.ir` | Tester Agent | Unit, integration, e2e test specs |
| `pipeline.spec.ir` | DevOps Agent | CI/CD orchestration |

These artifacts are **language-agnostic** and describe **what** the system should do, not **how** to write it in a specific language.

## Example: User Authentication

**Input (Natural Language):**
```
Create a user authentication system with email/password login,
session management, and rate limiting
```

**Output (Language-Agnostic IR):**
- Complete contract specification with entities, operations, and constraints
- Architectural decisions (session storage, password hashing)
- Database schemas and migrations
- Detailed function implementations as semantic actions
- Comprehensive test specifications
- CI/CD pipeline definition

**Next Step (External Agents - Not Implemented Yet):**
- Java Agent → Spring Boot application
- Go Agent → Go microservice
- Terraform Agent → Infrastructure as code
- etc.

[Try it live →](https://mronus.github.io/spec)

## Repository Contents

```
spec/
├── README.md                              # This file
├── spec-language-design-proposal-v0.2.md  # Complete design proposal
├── LICENSE                                # MIT License
├── examples/                              # Sample IR artifacts (coming soon)
│   └── user-management/
└── poc/                                   # Proof-of-concept application
    ├── README.md                          # POC documentation
    ├── src/                               # React + TypeScript implementation
    └── ...
```

## The Proof-of-Concept

A web-based application demonstrating the **Spec Domain** agent pipeline. Six specialized AI agents collaborate to transform requirements into complete IR specifications:

1. **Product Agent** - Defines what the system does (`contract.spec.ir`)
2. **Architect Agent** - Designs the architecture (`module.spec.ir`, `infrastructure.spec.ir`, `data.spec.ir`)
3. **Scrum Agent** - Decomposes work into tasks (`tasks.spec.ir`)
4. **Developer Agent** - Implements detailed logic (`types.spec.ir`, `interfaces/*.spec.ir`, `functions/*.spec.ir`)
5. **Tester Agent** - Creates test specifications (`tests.spec.ir`)
6. **DevOps Agent** - Defines CI/CD (`pipeline.spec.ir`)

**Try it now:** [https://mronus.github.io/spec](https://mronus.github.io/spec)

**Run locally:** See [POC Documentation](poc/README.md)

### Key Features

- 🤖 Multi-agent orchestration with feedback loops
- 🔄 Automatic state persistence and resume capability
- 🔐 Browser-only execution (API keys never leave your machine)
- 📥 Download complete IR specifications as ZIP
- 🎯 Support for Claude and GPT models

## Current Status

**⚠️ Design Proposal v0.2 (Draft for Discussion)**

This is an active design proposal. The specification and POC are under development.

### What's Implemented

- ✅ Complete IR format specification (v0.2)
- ✅ Multi-agent orchestration pipeline
- ✅ IR artifact generation via LLMs (Claude/GPT)
- ✅ Web-based POC application
- ✅ Automatic state persistence

### Future Work

As outlined in the [full proposal](spec-language-design-proposal-v0.2.md#12-future-work):

- ⬜ Formal IR schema (JSON Schema / Protocol Buffers)
- ⬜ External language agents (Java, Go, Rust, Terraform, etc.)
- ⬜ Verification protocol for code validation
- ⬜ IR versioning and migration system
- ⬜ External agent registry/marketplace
- ⬜ Incremental IR updates (delta/patch format)

## Use Cases

Spec is designed for:

- **LLM-Driven Development at Scale** - Work on enterprise systems (100+ microservices) without context window limitations
- **Autonomous Development Pipelines** - Multi-agent systems that generate complete software specifications efficiently
- **Incremental Code Modification** - LLMs make targeted changes without loading entire codebases
- **Cross-Platform Development** - Single specification targeting multiple languages/frameworks
- **Large System Refactoring** - Modify distributed systems with minimal context per change
- **Architecture Documentation** - Formal, machine-readable, LLM-parseable architecture specifications
- **Code Generation Research** - Study LLM-optimized representations vs human-optimized languages
- **Educational Tools** - Teaching software architecture through formal, structured specifications

## Contributing

This is an open proposal and we welcome feedback:

- 📝 **Proposal Feedback** - Open an issue with the `proposal` label
- 🐛 **POC Issues** - Open an issue with the `poc` label
- 💡 **Ideas & Discussions** - Start a discussion in the Discussions tab
- 🔧 **Code Contributions** - Submit a PR (focus on POC improvements)

## Research & Citation

If you reference this work, please cite:

```bibtex
@misc{spec-ir-2026,
  title={Spec: A Language-Agnostic IR for Autonomous Software Development},
  author={Design Proposal v0.2},
  year={2026},
  url={https://github.com/mronus/spec},
  note={Design proposal with proof-of-concept implementation}
}
```

## License

MIT License - See [LICENSE](LICENSE) file

This proposal and reference implementation are provided as-is to encourage experimentation, discussion, and innovation in autonomous software development.

## Acknowledgments

Inspired by the vision of autonomous, multi-agent software development with clean separation between semantic specification and language-specific implementation.

Special thanks to the teams behind Claude (Anthropic) and GPT (OpenAI) for making the multi-agent orchestration possible.

---

**Explore the future of AI-driven software development**

[📄 Read the Proposal](spec-language-design-proposal-v0.2.md) • [🚀 Try the Demo](https://mronus.github.io/spec) • [💻 Run Locally](poc/README.md)
