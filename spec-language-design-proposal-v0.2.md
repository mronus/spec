# Spec: A Language-Agnostic IR for Autonomous Software Development

**Design Proposal v0.2**

**Date:** January 2026

**Status:** Draft for Discussion

---

## Executive Summary

This document proposes **Spec**, a programming language designed specifically for Large Language Models (LLMs) to represent software systems. Unlike traditional programming languages designed for human developers or compilers, Spec is optimized for **LLM comprehension, context efficiency, and autonomous agent collaboration**.

### The Core Problem

Current LLM-based development tools face critical limitations:
- **Context window constraints**: Can't hold entire large systems in context
- **Type safety vs. complexity tradeoff**: Java-style strictness creates brittleness; JavaScript-style flexibility creates bugs
- **Incremental changes are expensive**: Modifying one function requires loading the entire codebase
- **No LLM-native representation**: LLMs work with human-oriented languages (Java, Python) that weren't designed for machine comprehension

### The Spec Solution

Spec is an **LLM-native programming language** with these design goals:

1. **Context-Efficient by Design** — Each IR artifact is self-contained; LLMs can make changes with minimal context
2. **Structured for LLMs, Not Humans** — Optimized for LLM parsing and generation, not human readability
3. **Type-Safe Without Brittleness** — Semantic types without Java's ceremonial boilerplate
4. **Simple Without Error-Proneness** — Explicit structure without JavaScript's implicit behaviors
5. **Scalable to Large Systems** — Modular artifacts enable working on enterprise backends without context explosion
6. **Parallel by Default** — Clear dependency boundaries enable concurrent agent work

### How It Works

In an agentic software development pipeline, multiple specialized LLM agents (Product, Architect, Developer, Tester, DevOps) collaborate to produce a complete system specification in Spec IR. This specification is then handed off to **external Language Agents** (Java Agent, Go Agent, Terraform Agent, etc.) that have deep expertise in their respective domains and produce production-ready, deployable code.

### What Spec Defines

1. **IR Format** — The structure of artifacts produced by each agent type
2. **Semantic Vocabulary** — Actions, types, and expressions optimized for LLM understanding
3. **Context Requirements** — Explicit declaration of what each artifact needs
4. **Handoff Protocol** — How to package and deliver IR to external agents
5. **Verification Interface** — How external agents report success/failure

### What Spec Does NOT Define

- How to translate to any specific language (that's the external agent's job)
- What frameworks to use
- Type mappings to target languages
- Language-specific idioms or patterns
- Build systems or tooling

**Key Insight**: By creating a language optimized for LLMs rather than humans, Spec enables autonomous agents to work efficiently on large-scale systems while maintaining complete semantic clarity and type safety.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
   - 1.1 [Two-Domain Model](#11-two-domain-model)
   - 1.2 [Key Principles](#12-key-principles)
   - 1.3 [Why an IR Optimized for LLMs?](#13-why-an-ir-optimized-for-llms)
2. [Design Philosophy](#2-design-philosophy)
3. [Agent Pipeline](#3-agent-pipeline)
4. [IR Specification](#4-ir-specification)
   - 4.1 [Contract IR](#41-contract-ir)
   - 4.2 [Module IR](#42-module-ir)
   - 4.3 [Infrastructure IR](#43-infrastructure-ir)
   - 4.4 [Data IR](#44-data-ir)
   - 4.5 [Types IR](#45-types-ir)
   - 4.6 [Interface IR](#46-interface-ir)
   - 4.7 [Function IR](#47-function-ir)
   - 4.8 [Events IR](#48-events-ir)
   - 4.9 [Tests IR](#49-tests-ir)
   - 4.10 [Pipeline IR](#410-pipeline-ir)
5. [IR Action Vocabulary](#5-ir-action-vocabulary)
6. [Expression Language](#6-expression-language)
7. [Agent Handoff Protocol](#7-agent-handoff-protocol)
8. [Conflict Resolution](#8-conflict-resolution)
9. [Parallel Execution](#9-parallel-execution)
10. [External Agent Interface](#10-external-agent-interface)
11. [Complete Example](#11-complete-example)
12. [Future Work](#12-future-work)

---

## 1. Architecture Overview

### 1.1 Two-Domain Model

Spec separates concerns into two distinct domains:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SPEC DOMAIN                                    │
│                        (language agnostic)                                  │
│                                                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │ Product │───▶│Architect│───▶│  Scrum  │───▶│Developer│───▶│ Tester  │  │
│  │  Agent  │    │  Agent  │    │  Agent  │    │  Agent  │    │  Agent  │  │
│  └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘  │
│       │              │              │              │              │        │
│       ▼              ▼              ▼              ▼              ▼        │
│  ir::contract   ir::module     ir::tasks     ir::function    ir::tests    │
│                 ir::infra                    ir::types                     │
│                 ir::data                     ir::interface                 │
│                                              ir::events                    │
│                                                                             │
│                              ┌─────────┐                                   │
│                              │ DevOps  │                                   │
│                              │  Agent  │                                   │
│                              └────┬────┘                                   │
│                                   │                                        │
│                                   ▼                                        │
│                             ir::pipeline                                   │
│                                                                             │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      │ HANDOFF (all IR artifacts)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       EXTERNAL AGENTS DOMAIN                                │
│                    (language/framework specific)                            │
│                                                                             │
│  IR Type              External Agent                   Output               │
│  ───────────────────────────────────────────────────────────────────────── │
│  ir::function    ───▶ Java/Go/Rust/TS Agent      ───▶ Source Code          │
│  ir::interface   ───▶ Java/Go/Rust/TS Agent      ───▶ Source Code          │
│  ir::infra       ───▶ Terraform/Pulumi Agent     ───▶ IaC Code             │
│  ir::data        ───▶ Flyway/Prisma Agent        ───▶ Migrations           │
│  ir::tests       ───▶ JUnit/Playwright Agent     ───▶ Test Code            │
│  ir::pipeline    ───▶ GitHub/GitLab/Argo Agent   ───▶ CI/CD Config         │
│                                                                             │
│  These agents are NOT part of Spec.                                        │
│  They're independent, pluggable, replaceable.                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Key Principles

1. **Spec agents produce IR, not code** — All Spec agents output language-agnostic IR artifacts
2. **External agents produce code** — Language/framework-specific agents consume IR and produce deployable artifacts
3. **Clean handoff boundary** — The interface between domains is well-defined and stable
4. **Parallel by design** — IR is decomposed into parallelizable units at every level

### 1.3 Why an IR Optimized for LLMs?

Traditional programming languages (Java, Python, JavaScript) were designed for one of two audiences:
1. **Human developers** — Optimized for readability, maintainability, expressiveness
2. **Compilers** — Optimized for static analysis, type checking, machine code generation

**Spec is designed for a third audience: Large Language Models.**

#### The Context Window Problem

When LLMs work with existing programming languages on large systems, they face critical constraints:

**Problem: Context Explosion**
```
Want to modify: authenticate() function in UserService.java
LLM needs to load:
  - UserService.java (500 lines)
  - User.java (200 lines)
  - UserRepository.java (300 lines)
  - Session.java (150 lines)
  - Application config (100 lines)
  - Framework boilerplate (200 lines)

Total: ~1,450 lines just to change 20 lines of logic
```

With current LLMs (even with 200k token windows), this doesn't scale to:
- Enterprise microservices with hundreds of classes
- Infrastructure definitions across multiple environments
- Test suites with thousands of test cases
- Monorepos with dozens of services

**Spec's Solution: Self-Contained Artifacts**
```spec
Want to modify: authenticate.spec.ir function
LLM needs to load:
  - authenticate.spec.ir (contains complete function specification)
  - Referenced interfaces (signatures only, not implementations)
  - Referenced types (definitions only)

Total: ~200 tokens for targeted change
```

Each Spec IR artifact explicitly declares its dependencies and contains everything needed to understand and modify it.

#### Type Safety vs. Brittleness

**Java's Problem: Ceremonial Complexity**
```java
// Want: Store a user ID
// Get: Type ceremony that LLMs must generate correctly

import java.util.UUID;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class UserIdValidator {
    public Optional<UUID> validateUserId(String rawId) {
        try {
            return Optional.of(UUID.fromString(rawId));
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
```

**JavaScript's Problem: Implicit Behaviors**
```javascript
// Unclear types, runtime errors
function authenticate(email, password) {
  // Is email a string? An object? undefined?
  // Does password have a .trim() method?
  // Will this throw at runtime?
  return db.findUser(email.toLowerCase(), password.trim());
}
```

**Spec's Solution: Semantic Type Safety**
```spec
ir::function @authenticate {
  signature: {
    inputs: [
      { name: email, type: Email }      // Email is a semantic type
      { name: password, type: SecretString }
    ]
    output: { type: Result<UserSession, AuthError> }
  }

  body: [
    { action: call, target: user_repository.get_by_email, ... }
  ]
}
```

- **Type-safe**: Email is validated, SecretString is protected, Result is explicit
- **Not brittle**: No imports, no annotations, no ceremony
- **LLM-friendly**: Structure is consistent and predictable

#### Optimized for LLM Comprehension, Not Human Reading

Spec deliberately prioritizes **machine parsing over human aesthetics**:

**Human-Optimized (Traditional)**
```python
def calculate_discount(user, items):
    """Calculate discount based on user tier and item count."""
    if user.tier == "premium":
        return sum(item.price for item in items) * 0.2
    elif user.tier == "standard" and len(items) > 5:
        return sum(item.price for item in items) * 0.1
    else:
        return 0
```

**LLM-Optimized (Spec)**
```spec
{
  action: if
  condition: { expr: "user.tier == UserTier.Premium" }
  then: [
    {
      action: return_success
      value: { expr: "items.sum(i => i.price) * 0.2" }
    }
  ]
  else: [
    {
      action: if
      condition: { expr: "user.tier == UserTier.Standard and items.length > 5" }
      then: [...]
      else: [...]
    }
  ]
}
```

**Why this is better for LLMs:**
1. **Structured uniformly**: Every action has the same shape
2. **Explicit actions**: `if`, `return_success`, `expr` are unambiguous
3. **Type-checked expressions**: `UserTier.Premium` vs string "premium"
4. **No implicit control flow**: Everything is explicit
5. **Parseable without execution**: LLM doesn't need to "run" code mentally

#### Scaling to Large Backend Systems

**The Real-World Challenge**: Enterprise systems have:
- 100+ microservices
- 1000+ database tables
- 10,000+ API endpoints
- 100,000+ lines of code per service

**How Spec Scales:**

1. **Modular by Default**
   - Each function is a separate `.spec.ir` file
   - Each interface is independent
   - Changes to one function don't require loading others

2. **Explicit Dependencies**
   ```spec
   ir::function @authenticate {
     depends: [
       "@module/auth/interfaces/user-repository",
       "@module/auth/types"
     ]
   }
   ```
   LLM knows exactly what to load, nothing more.

3. **Context Requirement Declaration**
   ```spec
   task: {
     id: "TASK-042"
     context_required: [
       "@types/User",
       "@interfaces/UserRepository.signature"
     ]
     estimated_tokens: 800
   }
   ```
   LLMs can plan their context usage.

4. **Parallelization Through Isolation**
   - Multiple LLMs can work on different functions simultaneously
   - No shared state (unlike OOP with complex object graphs)
   - Clear boundaries enable wave-based execution

#### Summary: LLM-Native Design Goals

| Design Goal | Traditional Languages | Spec IR |
|-------------|----------------------|---------|
| **Primary Audience** | Human developers | Large Language Models |
| **Context Efficiency** | Load entire files/modules | Self-contained artifacts |
| **Type Safety** | Java: Too complex<br>JS: Too loose | Semantic types, no ceremony |
| **Incremental Changes** | Expensive (load dependencies) | Cheap (self-contained) |
| **Readability** | Optimized for humans | Optimized for LLM parsing |
| **Scaling** | Monolithic files/classes | Granular, modular artifacts |
| **Parallelization** | Limited (shared state) | Default (isolated artifacts) |

**The Bottom Line**: Spec is the first programming language designed from the ground up for LLM-based development at scale.

---

## 2. Design Philosophy

### 2.1 Core Principles

#### 1. LLM-First, Human-Second

**Optimize for Machine Comprehension**

Spec prioritizes LLM parsing efficiency over human readability. Traditional languages optimize for human aesthetics (beautiful syntax, expressive idioms). Spec optimizes for:
- Consistent, predictable structure
- Explicit over implicit
- Parseable without execution
- Uniform patterns across all constructs

```spec
// LLM-optimized: Explicit, structured, parseable
{
  action: branch_on_variant
  source: user.status
  cases: [
    { pattern: { variant: "Active" }, then: [...] },
    { pattern: { variant: "Suspended" }, then: [...] }
  ]
}

// Avoid: Implicit behaviors that require "running" code mentally
if (user.status === "active") { ... }  // String comparison, runtime behavior
```

**Why this matters for LLMs:**
- Reduces token count (compact structure)
- Enables confident generation (no ambiguity)
- Facilitates validation (can parse without executing)

#### 2. Context-Efficient by Design

**Self-Contained Artifacts**

Every IR artifact is completely self-contained. LLMs don't need to load external context to understand or modify it.

```spec
ir::function @authenticate {
  // Everything needed is declared here
  depends: [
    "@module/auth/interfaces/user-repository",
    "@module/auth/types"
  ]

  signature: { ... }  // Complete signature
  body: [ ... ]       // Complete implementation
  properties: [ ... ] // Complete invariants
}
```

**Complete Information, No Assumed Context**
- Traditional code: `import UserRepository` (LLM must find and load UserRepository.java)
- Spec IR: Explicit dependency declaration with interface signature embedded
- Result: LLM can work on one function without loading entire codebase

**Explicit Context Requirements**
Each task/artifact declares exactly what it needs:
```spec
task: {
  context_required: [
    "@types/User",                    # Just the type definition
    "@interfaces/UserRepository.signature"  # Just the signature, not impl
  ]
  estimated_tokens: 800
}
```

This enables:
- Predictable token usage
- Targeted context loading
- Parallel execution (clear boundaries)

#### 3. Semantic Richness, Syntactic Neutrality

**Describe WHAT, Not HOW**

IR describes semantic intent without prescribing language syntax.

```spec
// Good: describes semantic intent
{
  action: branch_on_variant
  source: user.status
  cases: [...]
}

// Bad: prescribes language syntax
{
  action: switch_statement  // Too language-specific
}
```

External agents decide HOW to implement WHAT Spec describes:
- Java Agent → `switch (status) { ... }`
- Go Agent → `switch status { ... }`
- Rust Agent → `match status { ... }`
- TypeScript Agent → `switch (status) { ... }` or pattern matching

#### 4. Type-Safe Without Brittleness

**Semantic Types Over Syntactic Types**

Spec uses semantic types that convey meaning, not implementation ceremony:

```spec
// Semantic type: conveys meaning
{ name: email, type: Email }          // Email validates and guarantees format
{ name: password, type: SecretString } // SecretString is redacted in logs
{ name: userId, type: UUID }          // UUID guarantees valid format

// Not this (Java):
@Email @NotNull private String email;
@JsonProperty("password") private String password;
@Id @GeneratedValue private UUID userId;
```

**Benefits:**
- LLMs generate types based on semantics, not boilerplate
- No import statements, no annotations
- Type safety without complexity
- Clear intent without ceremony

#### 5. Explicit Over Implicit

**No Hidden Behaviors**

Every action, side effect, and control flow is explicit:

```spec
// Explicit: every action is declared
{
  action: call
  target: user_repository.get_by_email
  inputs: { email: { var: email } }
  outputs: { result: { name: user_option, type: "Option<User>" } }
}
{
  action: if_none
  condition: { var: user_option }
  then: [
    { action: return_error, error: { type: "AuthError.InvalidCredentials" } }
  ]
}

// Avoid implicit behaviors (like JavaScript):
const user = await userRepo.getByEmail(email);  // Might throw, might return null
if (!user) return { error: "invalid" };        // Unclear error type
```

**What must be explicit:**
- All function calls (`action: call`)
- All side effects (`reads: [...]`, `writes: [...]`, `emits: [...]`)
- All error handling (`if_error`, `return_error`, `propagate_error`)
- All control flow (`if`, `match`, `loop_for`)
- All async operations (`call_async`)

#### 6. Composable and Parallelizable

**Isolated Artifacts Enable Concurrency**

Each IR unit is independent with explicit dependencies:

```spec
# Wave 0: Foundation (sequential)
- types.spec.ir

# Wave 1: Parallel execution
- user-repository.spec.ir (depends: types)
- session-cache.spec.ir (depends: types)
- password-hasher.spec.ir (depends: types)

# Wave 2: Parallel execution
- authenticate.spec.ir (depends: wave 1 artifacts)
- revoke-session.spec.ir (depends: wave 1 artifacts)
```

**Benefits:**
- Multiple LLMs can work simultaneously
- Clear dependency graph
- No shared mutable state
- Massive speedup for large systems

#### 7. Verifiable Contracts

**Properties and Invariants**

IR includes formal properties that external agents must satisfy:

```spec
properties: {
  invariants: [
    {
      id: "INV-1"
      description: "Successful auth always creates exactly one session"
      formal: "return.is_success implies session_cache.store.called_once"
    }
  ]

  postconditions: [
    {
      id: "POST-1"
      description: "Session expiry is always in the future"
      formal: "return.is_success implies return.value.expires_at > now()"
    }
  ]
}
```

External agents report verification:
```json
{
  "artifact": "authenticate.spec.ir",
  "verification": {
    "INV-1": "satisfied",
    "POST-1": "satisfied",
    "test_coverage": "95%"
  }
}
```

### 2.2 What Spec Defines vs. What External Agents Decide

| Spec Defines | External Agents Decide |
|--------------|------------------------|
| Semantic operations (what to do) | Language syntax (how to write it) |
| Data types and constraints | Type mappings (UUID → java.util.UUID) |
| Control flow (branching, loops) | Idioms (switch vs if-else vs pattern matching) |
| Error cases and handling strategy | Exception vs Result types |
| Effects (reads, writes, emits) | Framework wiring (Spring DI, Go interfaces) |
| Test cases and assertions | Test framework (JUnit, Go testing, pytest) |
| Infrastructure requirements | IaC tool (Terraform, Pulumi, CloudFormation) |
| Pipeline stages | CI/CD platform (GitHub Actions, GitLab CI, Argo) |

---

## 3. Agent Pipeline

### 3.1 Agent Responsibilities and Outputs

| Agent | Input | Output IR Types | Decisions Made |
|-------|-------|-----------------|----------------|
| **Product** | Human requirements | `ir::contract` | Entities, operations, constraints, NFRs |
| **Architect** | Contract | `ir::module`, `ir::infra`, `ir::data` | Services, storage, network, security |
| **Scrum** | Module | `ir::tasks` | Decomposition, dependencies, parallelization |
| **Developer** | Tasks | `ir::types`, `ir::interface`, `ir::function`, `ir::events` | Implementation logic, algorithms |
| **Tester** | Functions + Properties | `ir::tests` | Test cases, mocks, assertions |
| **DevOps** | All above | `ir::pipeline` | Build, test, deploy orchestration |

### 3.2 Complete IR Artifact Set

A fully specified module produces these artifacts:

```
@module/user-management/
├── contract.spec.ir           # Product Agent
├── module.spec.ir             # Architect Agent
├── infrastructure.spec.ir     # Architect Agent
├── data.spec.ir               # Architect Agent
├── decisions.spec.ir          # Architect Agent
├── tasks.spec.ir              # Scrum Agent
├── types.spec.ir              # Developer Agent
├── interfaces/           # Developer Agent
│   ├── user-repository.spec.ir
│   ├── session-cache.spec.ir
│   ├── password-hasher.spec.ir
│   └── rate-limiter.spec.ir
├── functions/            # Developer Agent
│   ├── authenticate.spec.ir
│   ├── revoke-session.spec.ir
│   └── create-user.spec.ir
├── events.spec.ir             # Developer Agent
├── tests.spec.ir              # Tester Agent
├── pipeline.spec.ir           # DevOps Agent
└── properties.spec.ir         # Shared invariants
```

---

## 4. IR Specification

### 4.1 Contract IR

Produced by: **Product Agent**

Defines what the system does without specifying how.

```spec
ir::contract @contract/user-management {
  version: "1.0.0"
  
  meta: {
    created_by: ProductAgent
    reviewed_by: [ HumanReview ]
    status: approved
  }
  
  description: """
    User authentication and session management for the platform.
    Supports email/password authentication with time-bounded sessions.
  """
  
  entities: [
    {
      name: User
      description: "A registered user of the system"
      fields: [
        { name: id, type: UUID, description: "Unique identifier" },
        { name: email, type: Email, description: "User's email address", constraints: [ unique ] },
        { name: name, type: String, constraints: [ { max_length: 100 } ] },
        { name: status, type: { enum: [ Active, Suspended, Deleted ] } },
        { name: created_at, type: Timestamp }
      ]
    },
    {
      name: UserSession
      description: "An active authentication session"
      fields: [
        { name: id, type: UUID },
        { name: user_id, type: UUID, references: "User.id" },
        { name: expires_at, type: Timestamp },
        { name: status, type: { enum: [ Valid, Expired, Revoked ] } }
      ]
    }
  ]
  
  operations: [
    {
      name: AuthenticateUser
      description: "Verify user credentials and create a session"
      
      input: {
        fields: [
          { name: email, type: Email },
          { name: password, type: SecretString }
        ]
      }
      
      output: {
        type: UserSession
      }
      
      errors: [
        { name: InvalidCredentials, description: "Email or password is incorrect", expose_details: false },
        { name: AccountSuspended, fields: [ { name: reason, type: String } ] },
        { name: RateLimited, fields: [ { name: retry_after, type: Duration } ] }
      ]
      
      constraints: [
        {
          description: "Sessions expire after 24 hours of inactivity"
          formal: "output.expires_at == now() + 24.hours"
        },
        {
          description: "Failed attempts are rate limited"
          formal: "rate_limit(input.email, 5.per_minute)"
        }
      ]
    },
    {
      name: RevokeSession
      description: "Invalidate an active session"
      
      input: {
        fields: [
          { name: session_id, type: UUID }
        ]
      }
      
      output: { type: Void }
      
      errors: [
        { name: SessionNotFound }
      ]
    }
  ]
  
  invariants: [
    {
      id: "INV-001"
      description: "Deleted users cannot have active sessions"
      formal: "forall s: UserSession where s.status == Valid => s.user_id.status != Deleted"
    },
    {
      id: "INV-002"
      description: "Session expiry is always in the future at creation"
      formal: "forall s: UserSession at creation => s.expires_at > s.created_at"
    }
  ]
  
  requirements: {
    performance: [
      { metric: latency, percentile: p99, threshold: "< 200ms", operations: [ AuthenticateUser ] }
    ],
    capacity: [
      { metric: concurrent_sessions, threshold: 1000 }
    ],
    availability: {
      target: "99.9%"
    }
  }
}
```

### 4.2 Module IR

Produced by: **Architect Agent**

Defines service decomposition and component interactions.

```spec
ir::module @module/user-management {
  version: "1.0.0"
  
  meta: {
    implements: @contract/user-management
    created_by: ArchitectAgent
  }
  
  decisions: [
    {
      id: "DEC-001"
      name: SessionStorage
      choice: Redis
      rationale: "Need distributed storage for k8s deployment, sub-ms latency required"
      alternatives_rejected: [
        { option: JWT, reason: "No server-side revocation capability" },
        { option: PostgreSQL, reason: "Latency requirements not achievable" }
      ]
    },
    {
      id: "DEC-002"
      name: PasswordHashing
      choice: Argon2id
      rationale: "Current best practice, memory-hard algorithm"
    }
  ]
  
  dependencies: {
    external: [
      { name: Database, type: PostgreSQL, purpose: "User data persistence" },
      { name: Cache, type: Redis, purpose: "Session storage and rate limiting" },
      { name: EventBus, type: Kafka, purpose: "Domain event streaming" }
    ]
  }
  
  components: [
    {
      id: "user-repository"
      type: repository
      description: "Persistent storage for user records"
      interface: @module/user-management/interfaces/user-repository
      storage: Database
    },
    {
      id: "session-cache"
      type: cache
      description: "Session storage with TTL"
      interface: @module/user-management/interfaces/session-cache
      storage: Cache
    },
    {
      id: "password-hasher"
      type: utility
      description: "Password hashing and verification"
      interface: @module/user-management/interfaces/password-hasher
      pure: true
    },
    {
      id: "rate-limiter"
      type: utility
      description: "Request rate limiting"
      interface: @module/user-management/interfaces/rate-limiter
      storage: Cache
    }
  ]
  
  services: [
    {
      id: "auth-service"
      type: service
      description: "Authentication orchestration"
      
      implements: [
        "@contract/user-management/operations/AuthenticateUser",
        "@contract/user-management/operations/RevokeSession"
      ]
      
      uses: [ "user-repository", "session-cache", "password-hasher", "rate-limiter" ]
      
      interface: @module/user-management/interfaces/auth-service
    },
    {
      id: "user-service"
      type: service
      description: "User lifecycle management"
      
      implements: [
        "@contract/user-management/operations/CreateUser"
      ]
      
      uses: [ "user-repository", "password-hasher", "auth-service" ]
      
      interface: @module/user-management/interfaces/user-service
    }
  ]
  
  api: {
    http: [
      { method: POST, path: "/api/v1/auth/login", handler: "auth-service.authenticate" },
      { method: POST, path: "/api/v1/auth/logout", handler: "auth-service.revoke_session" },
      { method: POST, path: "/api/v1/users", handler: "user-service.create_user" },
      { method: GET, path: "/api/v1/users/{id}", handler: "user-service.get_user" }
    ]
  }
}
```

### 4.3 Infrastructure IR

Produced by: **Architect Agent**

Defines compute, network, storage, and security requirements.

```spec
ir::infra @module/user-management/infrastructure {
  version: "1.0.0"
  
  meta: {
    module: @module/user-management
    created_by: ArchitectAgent
  }
  
  compute: [
    {
      id: "auth-service"
      type: container
      description: "Authentication service"
      
      implements: [ "@module/user-management/services/auth-service" ]
      
      resources: {
        cpu: { request: "100m", limit: "500m" }
        memory: { request: "256Mi", limit: "512Mi" }
      }
      
      scaling: {
        min_replicas: 2
        max_replicas: 10
        metrics: [
          { type: cpu, target_percentage: 70 },
          { type: custom, name: "requests_per_second", target: 1000 }
        ]
      }
      
      health: {
        readiness: { path: "/health/ready", interval: "5s", timeout: "3s" }
        liveness: { path: "/health/live", interval: "10s", timeout: "5s" }
      }
      
      ports: [
        { name: http, container_port: 8080, protocol: TCP }
      ]
      
      env_from: [
        { type: secret, ref: "auth-service-secrets" },
        { type: config, ref: "auth-service-config" }
      ]
    }
  ]
  
  network: {
    ingress: [
      {
        id: "public-api"
        type: load_balancer
        
        routes: [
          { path: "/api/v1/auth/*", target: "auth-service", port: 8080 },
          { path: "/api/v1/users/*", target: "user-service", port: 8080 }
        ]
        
        tls: {
          enabled: true
          cert_source: managed
          min_version: "1.3"
        }
        
        rate_limit: {
          requests_per_second: 100
          burst: 200
        }
      }
    ]
    
    internal: [
      {
        id: "service-mesh"
        services: [ "auth-service", "user-service" ]
        mtls: true
      }
    ]
  }
  
  storage: {
    databases: [
      {
        id: "users-db"
        type: postgresql
        version: "15"
        
        purpose: "Primary user data storage"
        
        sizing: {
          storage: "100Gi"
          iops: 3000
        }
        
        high_availability: {
          replicas: 2
          multi_az: true
          backup: {
            enabled: true
            retention_days: 30
            window: "03:00-04:00"
          }
        }
        
        connection: {
          secret_ref: "users-db-credentials"
          max_connections: 100
          ssl_mode: require
        }
        
        schemas: [ "@module/user-management/data" ]
      }
    ]
    
    caches: [
      {
        id: "session-cache"
        type: redis
        version: "7"
        mode: cluster
        
        purpose: "Session storage and rate limiting"
        
        sizing: {
          num_shards: 3
          replicas_per_shard: 2
        }
        
        config: {
          eviction_policy: "volatile-lru"
          max_memory_policy: "noeviction"
        }
        
        connection: {
          secret_ref: "redis-credentials"
          ssl: true
        }
      }
    ]
    
    queues: [
      {
        id: "events-queue"
        type: kafka
        
        purpose: "Domain event streaming"
        
        topics: [
          {
            name: "user.events"
            partitions: 6
            replication_factor: 3
            retention: "7d"
            schemas: [ "@module/user-management/events" ]
          }
        ]
        
        connection: {
          secret_ref: "kafka-credentials"
          security_protocol: "SASL_SSL"
        }
      }
    ]
  }
  
  security: {
    secrets: [
      {
        id: "auth-service-secrets"
        entries: [
          { key: "DATABASE_URL", source: { ref: "users-db", field: "connection_string" } },
          { key: "REDIS_URL", source: { ref: "session-cache", field: "connection_string" } },
          { key: "JWT_SIGNING_KEY", source: { generated: true, rotation: "90d" } }
        ]
      }
    ]
    
    iam: [
      {
        id: "auth-service-role"
        service: "auth-service"
        permissions: [
          { resource: "users-db", actions: [ "read", "write" ] },
          { resource: "session-cache", actions: [ "read", "write" ] },
          { resource: "events-queue", actions: [ "publish" ] }
        ]
      }
    ]
    
    encryption: {
      at_rest: { enabled: true, key_management: managed }
      in_transit: { enabled: true, min_tls_version: "1.3" }
    }
  }
  
  observability: {
    metrics: {
      enabled: true
      scrape_interval: "15s"
      custom_metrics: [
        { name: "auth_attempts_total", type: counter, labels: [ "status", "method" ] },
        { name: "session_duration_seconds", type: histogram }
      ]
    }
    
    logging: {
      format: json
      level: { default: info }
      retention: "30d"
    }
    
    tracing: {
      enabled: true
      sampling_rate: 0.1
    }
    
    alerting: [
      {
        name: "high_auth_failure_rate"
        condition: "rate(auth_attempts_total{status='failed'}[5m]) > 100"
        severity: warning
      },
      {
        name: "database_connection_exhaustion"
        condition: "active_connections / max_connections > 0.9"
        severity: critical
      }
    ]
  }
}
```

### 4.4 Data IR

Produced by: **Architect Agent**

Defines database schemas, migrations, and seed data.

```spec
ir::data @module/user-management/data {
  version: "1.0.0"
  
  meta: {
    module: @module/user-management
    created_by: ArchitectAgent
    storage: "@infra/user-management/storage/databases/users-db"
  }
  
  schemas: [
    {
      id: "users"
      
      tables: [
        {
          name: "users"
          description: "Core user records"
          
          columns: [
            { name: "id", type: uuid, primary_key: true, default: "gen_random_uuid()" },
            { name: "email", type: "varchar(255)", nullable: false },
            { name: "password_hash", type: "varchar(255)", nullable: false },
            { name: "name", type: "varchar(100)", nullable: false },
            { name: "status", type: "varchar(20)", nullable: false, default: "'active'" },
            { name: "status_reason", type: "text", nullable: true },
            { name: "failed_attempts", type: integer, nullable: false, default: 0 },
            { name: "last_attempt_at", type: timestamp_tz, nullable: true },
            { name: "created_at", type: timestamp_tz, nullable: false, default: "now()" },
            { name: "updated_at", type: timestamp_tz, nullable: false, default: "now()" }
          ]
          
          indexes: [
            { name: "users_email_idx", columns: [ "email" ], unique: true },
            { name: "users_status_idx", columns: [ "status" ] }
          ]
          
          constraints: [
            { type: check, name: "users_status_check", 
              expression: "status IN ('active', 'suspended', 'deleted')" }
          ]
        },
        
        {
          name: "user_sessions"
          description: "Session audit log"
          
          columns: [
            { name: "id", type: uuid, primary_key: true },
            { name: "user_id", type: uuid, nullable: false },
            { name: "created_at", type: timestamp_tz, nullable: false },
            { name: "expires_at", type: timestamp_tz, nullable: false },
            { name: "revoked_at", type: timestamp_tz, nullable: true }
          ]
          
          foreign_keys: [
            { columns: [ "user_id" ], references: "users(id)", on_delete: "CASCADE" }
          ]
          
          indexes: [
            { name: "sessions_user_id_idx", columns: [ "user_id" ] }
          ]
        }
      ]
    }
  ]
  
  migrations: {
    strategy: versioned
    
    steps: [
      {
        version: "1.0.0"
        description: "Initial schema"
        creates: [ "users", "user_sessions" ]
      }
    ]
  }
  
  seed_data: {
    environments: [ "development", "staging" ]
    
    data: [
      {
        table: "users"
        records: [
          {
            id: "00000000-0000-0000-0000-000000000001"
            email: "admin@example.com"
            password_hash: { placeholder: "hash:admin123" }
            name: "Admin User"
            status: "active"
          }
        ]
      }
    ]
  }
}
```

### 4.5 Types IR

Produced by: **Developer Agent**

Defines shared type definitions used across the module.

```spec
ir::types @module/user-management/types {
  version: "1.0.0"
  
  meta: {
    module: @module/user-management
    created_by: DeveloperAgent
  }
  
  primitives: [
    {
      name: UUID
      kind: primitive
      format: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
      validation: { regex: "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}" }
    },
    {
      name: Email
      kind: constrained
      base: string
      validation: { regex: "^[^@]+@[^@]+\\.[^@]+$" }
      max_length: 255
    },
    {
      name: SecretString
      kind: sensitive
      base: string
      redact_in_logs: true
    },
    {
      name: Timestamp
      kind: primitive
      format: "ISO8601"
    },
    {
      name: Duration
      kind: primitive
      unit: milliseconds
    }
  ]
  
  enums: [
    {
      name: UserStatus
      variants: [
        { name: Active, fields: [] },
        { name: Suspended, fields: [ { name: reason, type: string } ] },
        { name: Deleted, fields: [] }
      ]
    },
    {
      name: SessionStatus
      variants: [
        { name: Valid, fields: [] },
        { name: Expired, fields: [] },
        { name: Revoked, fields: [] }
      ]
    }
  ]
  
  structs: [
    {
      name: UserRecord
      fields: [
        { name: id, type: UUID, generated: true, immutable: true },
        { name: email, type: Email, unique: true, indexed: true },
        { name: password_hash, type: string, sensitive: true },
        { name: name, type: string },
        { name: status, type: UserStatus },
        { name: failed_attempts, type: int, default: 0 },
        { name: last_attempt_at, type: Timestamp, nullable: true },
        { name: created_at, type: Timestamp, generated: true, immutable: true },
        { name: updated_at, type: Timestamp, generated: true }
      ]
    },
    {
      name: UserSession
      fields: [
        { name: id, type: UUID, generated: true, immutable: true },
        { name: user_id, type: UUID, references: "UserRecord.id" },
        { name: created_at, type: Timestamp, generated: true },
        { name: expires_at, type: Timestamp },
        { name: status, type: SessionStatus }
      ]
    }
  ]
  
  errors: [
    {
      name: AuthError
      variants: [
        { name: InvalidCredentials, fields: [], expose_details: false },
        { name: AccountSuspended, fields: [ { name: reason, type: string } ] },
        { name: AccountLocked, fields: [ { name: retry_after, type: Duration } ] },
        { name: RateLimited, fields: [ { name: retry_after, type: Duration } ] }
      ]
    }
  ]
}
```

### 4.6 Interface IR

Produced by: **Developer Agent**

Defines component API surfaces.

```spec
ir::interface @module/user-management/interfaces/user-repository {
  version: "1.0.0"
  
  meta: {
    module: @module/user-management
    component: user-repository
    created_by: DeveloperAgent
  }
  
  depends: [ "@module/user-management/types" ]
  
  interface: {
    name: UserRepository
    description: "Persistent storage for user records"
    
    methods: [
      {
        name: get_by_id
        description: "Retrieve a user by their unique identifier"
        
        inputs: [
          { name: id, type: UUID }
        ]
        
        output: {
          type: UserRecord
          nullable: true
        }
        
        errors: []
        
        effects: {
          reads: [ database ]
        }
      },
      {
        name: get_by_email
        description: "Retrieve a user by their email address"
        
        inputs: [
          { name: email, type: Email }
        ]
        
        output: {
          type: UserRecord
          nullable: true
        }
        
        errors: []
        
        effects: {
          reads: [ database ]
        }
      },
      {
        name: create
        description: "Create a new user record"
        
        inputs: [
          { name: user, type: UserRecord }
        ]
        
        output: {
          type: UserRecord
        }
        
        errors: [
          { name: DuplicateEmail, when: "email already exists" }
        ]
        
        effects: {
          reads: [ database ]
          writes: [ database ]
        }
      },
      {
        name: update
        description: "Update an existing user record"
        
        inputs: [
          { name: user, type: UserRecord }
        ]
        
        output: {
          type: UserRecord
        }
        
        errors: [
          { name: NotFound, when: "user.id does not exist" }
        ]
        
        effects: {
          reads: [ database ]
          writes: [ database ]
        }
      }
    ]
  }
}
```

### 4.7 Function IR

Produced by: **Developer Agent**

The core implementation unit—detailed pseudo-code for a single function.

```spec
ir::function @module/user-management/functions/authenticate {
  version: "1.0.0"
  
  meta: {
    implements: "@contract/user-management/operations/AuthenticateUser"
    service: "@module/user-management/services/auth-service"
    task: "@tasks/TASK-2026-0113-042"
    created_by: DeveloperAgent
  }
  
  depends: [
    "@module/user-management/types",
    "@module/user-management/interfaces/user-repository",
    "@module/user-management/interfaces/session-cache",
    "@module/user-management/interfaces/password-hasher",
    "@module/user-management/interfaces/rate-limiter",
    "@module/user-management/events"
  ]
  
  signature: {
    name: authenticate
    
    inputs: [
      { name: email, type: Email },
      { name: password, type: SecretString }
    ]
    
    output: { type: UserSession }
    
    errors: [ AuthError ]
  }
  
  dependencies: [
    { name: user_repository, interface: UserRepository },
    { name: session_cache, interface: SessionCache },
    { name: password_hasher, interface: PasswordHasher },
    { name: rate_limiter, interface: RateLimiter },
    { name: event_bus, interface: EventBus }
  ]
  
  effects: {
    reads: [ user_repository, session_cache, rate_limiter ]
    writes: [ session_cache, rate_limiter ]
    emits: [ UserAuthenticated, AuthenticationFailed ]
  }
  
  constants: {
    RATE_LIMIT: { value: 5, unit: "per_minute" }
    SESSION_DURATION: { value: 24, unit: "hours" }
  }
  
  body: [
    // Step 1: Rate limit check
    {
      id: 1
      action: call
      description: "Check rate limit for this email"
      target: rate_limiter.check
      inputs: {
        key: { expr: "email.to_string()" }
        limit: { ref: "RATE_LIMIT" }
      }
      outputs: {
        result: { name: rate_check_result, type: "Result<void, RateLimited>" }
      }
    },
    {
      id: 2
      action: if_error
      condition: { var: rate_check_result }
      then: [
        {
          id: "2.1"
          action: return_error
          error: {
            type: "AuthError.RateLimited"
            fields: {
              retry_after: { value: 1, unit: "minute" }
            }
          }
        }
      ]
    },
    
    // Step 2: Lookup user
    {
      id: 3
      action: call
      description: "Find user by email"
      target: user_repository.get_by_email
      inputs: {
        email: { var: email }
      }
      outputs: {
        result: { name: user_option, type: "Option<UserRecord>" }
      }
    },
    {
      id: 4
      action: if_none
      condition: { var: user_option }
      then: [
        {
          id: "4.1"
          action: return_error
          error: { type: "AuthError.InvalidCredentials" }
        }
      ]
    },
    {
      id: 5
      action: unwrap
      source: { var: user_option }
      outputs: {
        result: { name: user, type: UserRecord }
      }
    },
    
    // Step 3: Check user status
    {
      id: 6
      action: match
      description: "Verify user account status"
      source: { expr: "user.status" }
      cases: [
        {
          pattern: { variant: "UserStatus.Suspended", bind: { reason: "suspend_reason" } }
          then: [
            {
              id: "6.1.1"
              action: emit_event
              event: AuthenticationFailed
              data: {
                email: { var: email }
                reason: { literal: "account_suspended" }
                timestamp: { generate: now }
              }
            },
            {
              id: "6.1.2"
              action: return_error
              error: {
                type: "AuthError.AccountSuspended"
                fields: {
                  reason: { literal: "Account suspended. Contact support." }
                }
              }
            }
          ]
        },
        {
          pattern: { variant: "UserStatus.Deleted" }
          then: [
            {
              id: "6.2.1"
              action: return_error
              error: { type: "AuthError.InvalidCredentials" }
              comment: "Don't reveal that account was deleted"
            }
          ]
        },
        {
          pattern: { variant: "UserStatus.Active" }
          then: []
          comment: "Continue to password verification"
        }
      ]
    },
    
    // Step 4: Verify password
    {
      id: 7
      action: call
      description: "Verify password hash"
      target: password_hasher.verify
      inputs: {
        password: { var: password }
        hash: { expr: "user.password_hash" }
      }
      outputs: {
        result: { name: password_valid, type: bool }
      }
    },
    {
      id: 8
      action: if
      condition: { expr: "not password_valid" }
      then: [
        {
          id: "8.1"
          action: emit_event
          event: AuthenticationFailed
          data: {
            email: { var: email }
            reason: { literal: "invalid_password" }
            timestamp: { generate: now }
          }
        },
        {
          id: "8.2"
          action: call_async
          comment: "Fire and forget - update failed attempts"
          target: user_repository.update
          inputs: {
            user: {
              expr: "user with { failed_attempts: user.failed_attempts + 1, last_attempt_at: now() }"
            }
          }
        },
        {
          id: "8.3"
          action: return_error
          error: { type: "AuthError.InvalidCredentials" }
        }
      ]
    },
    
    // Step 5: Create session
    {
      id: 9
      action: construct
      description: "Create new session"
      type: UserSession
      fields: {
        id: { generate: uuid }
        user_id: { expr: "user.id" }
        created_at: { generate: now }
        expires_at: {
          generate: now
          offset: { ref: "SESSION_DURATION" }
        }
        status: { variant: "SessionStatus.Valid" }
      }
      outputs: {
        result: { name: session, type: UserSession }
      }
    },
    
    // Step 6: Store session
    {
      id: 10
      action: call
      description: "Persist session to cache"
      target: session_cache.store
      inputs: {
        session: { var: session }
      }
      outputs: {
        result: { name: store_result, type: "Result<void, CacheError>" }
      }
    },
    {
      id: 11
      action: if_error
      condition: { var: store_result }
      then: [
        {
          id: "11.1"
          action: propagate_error
          source: { var: store_result }
        }
      ]
    },
    
    // Step 7: Emit success event
    {
      id: 12
      action: emit_event
      event: UserAuthenticated
      data: {
        user_id: { expr: "user.id" }
        session_id: { expr: "session.id" }
        timestamp: { generate: now }
      }
    },
    
    // Step 8: Reset failed attempts
    {
      id: 13
      action: if
      condition: { expr: "user.failed_attempts > 0" }
      then: [
        {
          id: "13.1"
          action: call_async
          comment: "Fire and forget - reset failed attempts"
          target: user_repository.update
          inputs: {
            user: {
              expr: "user with { failed_attempts: 0, last_attempt_at: null }"
            }
          }
        }
      ]
    },
    
    // Step 9: Return success
    {
      id: 14
      action: return_success
      value: { var: session }
    }
  ]
  
  properties: {
    invariants: [
      {
        id: "INV-1"
        description: "Successful auth always creates exactly one session"
        formal: "return.is_success implies session_cache.store.called_once"
      },
      {
        id: "INV-2"
        description: "Failed auth never creates a session"
        formal: "return.is_error implies not session_cache.store.called"
      }
    ]
    
    postconditions: [
      {
        id: "POST-1"
        description: "Session expiry is always in the future"
        formal: "return.is_success implies return.value.expires_at > now()"
      }
    ]
  }
}
```

### 4.8 Events IR

Produced by: **Developer Agent**

Defines domain events and their schemas.

```spec
ir::events @module/user-management/events {
  version: "1.0.0"
  
  meta: {
    module: @module/user-management
    created_by: DeveloperAgent
  }
  
  depends: [ "@module/user-management/types" ]
  
  events: [
    {
      name: UserAuthenticated
      description: "Emitted when a user successfully authenticates"
      
      fields: [
        { name: user_id, type: UUID },
        { name: session_id, type: UUID },
        { name: timestamp, type: Timestamp }
      ]
      
      topic: "user.authenticated"
      schema_version: "1.0.0"
    },
    {
      name: AuthenticationFailed
      description: "Emitted when authentication fails"
      
      fields: [
        { name: email, type: Email, sensitive: true },
        { name: reason, type: string },
        { name: timestamp, type: Timestamp }
      ]
      
      topic: "user.auth_failed"
      schema_version: "1.0.0"
    },
    {
      name: SessionRevoked
      description: "Emitted when a session is invalidated"
      
      fields: [
        { name: session_id, type: UUID },
        { name: user_id, type: UUID },
        { name: revoked_by, type: UUID, nullable: true },
        { name: timestamp, type: Timestamp }
      ]
      
      topic: "user.session_revoked"
      schema_version: "1.0.0"
    },
    {
      name: UserCreated
      description: "Emitted when a new user registers"
      
      fields: [
        { name: user_id, type: UUID },
        { name: email, type: Email },
        { name: timestamp, type: Timestamp }
      ]
      
      topic: "user.created"
      schema_version: "1.0.0"
    }
  ]
}
```

### 4.9 Tests IR

Produced by: **Tester Agent**

Defines unit, integration, and e2e test specifications.

```spec
ir::tests @module/user-management/tests {
  version: "1.0.0"
  
  meta: {
    module: @module/user-management
    created_by: TesterAgent
    based_on: [
      "@module/user-management/functions/*",
      "@module/user-management/properties"
    ]
  }
  
  unit_tests: [
    {
      id: "auth-service-unit"
      target: "@module/user-management/functions/authenticate"
      
      mocks: [
        { dependency: user_repository, type: mock },
        { dependency: session_cache, type: mock },
        { dependency: password_hasher, type: mock },
        { dependency: rate_limiter, type: mock },
        { dependency: event_bus, type: spy }
      ]
      
      cases: [
        {
          id: "successful_authentication"
          description: "Valid credentials should create session and emit event"
          
          given: {
            state: [
              { mock: "rate_limiter.check", returns: { success: true } },
              {
                mock: "user_repository.get_by_email"
                with: { email: "test@example.com" }
                returns: {
                  some: {
                    id: "user-123"
                    email: "test@example.com"
                    password_hash: "hashed_password"
                    status: { variant: "Active" }
                    failed_attempts: 0
                  }
                }
              },
              {
                mock: "password_hasher.verify"
                with: { password: "correct_password", hash: "hashed_password" }
                returns: true
              },
              { mock: "session_cache.store", returns: { success: true } }
            ]
          }
          
          when: {
            action: call
            function: authenticate
            inputs: {
              email: "test@example.com"
              password: "correct_password"
            }
          }
          
          then: {
            assertions: [
              { type: returns_success },
              { type: result_field, field: "user_id", equals: "user-123" },
              { type: result_field, field: "status", equals: { variant: "Valid" } },
              { type: result_field, field: "expires_at", satisfies: "greater_than_now" },
              { type: mock_called, mock: "session_cache.store", times: 1 },
              { type: event_emitted, event: "UserAuthenticated", with: { user_id: "user-123" } }
            ]
          }
        },
        
        {
          id: "invalid_password"
          description: "Wrong password should return InvalidCredentials"
          
          given: {
            state: [
              { mock: "rate_limiter.check", returns: { success: true } },
              {
                mock: "user_repository.get_by_email"
                returns: {
                  some: {
                    id: "user-123"
                    status: { variant: "Active" }
                    password_hash: "hashed_password"
                  }
                }
              },
              { mock: "password_hasher.verify", returns: false }
            ]
          }
          
          when: {
            action: call
            function: authenticate
            inputs: { email: "test@example.com", password: "wrong_password" }
          }
          
          then: {
            assertions: [
              { type: returns_error, error: "AuthError.InvalidCredentials" },
              { type: mock_not_called, mock: "session_cache.store" },
              { type: event_emitted, event: "AuthenticationFailed" }
            ]
          }
        },
        
        {
          id: "user_not_found"
          description: "Non-existent email should return InvalidCredentials"
          
          given: {
            state: [
              { mock: "rate_limiter.check", returns: { success: true } },
              { mock: "user_repository.get_by_email", returns: { none: true } }
            ]
          }
          
          when: {
            action: call
            function: authenticate
            inputs: { email: "nonexistent@example.com", password: "any" }
          }
          
          then: {
            assertions: [
              { type: returns_error, error: "AuthError.InvalidCredentials" },
              { type: mock_not_called, mock: "password_hasher.verify" }
            ]
          }
        },
        
        {
          id: "rate_limited"
          description: "Exceeding rate limit should return RateLimited"
          
          given: {
            state: [
              { mock: "rate_limiter.check", returns: { error: "RateLimited" } }
            ]
          }
          
          when: {
            action: call
            function: authenticate
            inputs: { email: "test@example.com", password: "any" }
          }
          
          then: {
            assertions: [
              { type: returns_error, error: "AuthError.RateLimited" },
              { type: mock_not_called, mock: "user_repository.get_by_email" }
            ]
          }
        }
      ]
      
      property_tests: [
        {
          id: "no_session_on_failure"
          property: "@module/user-management/properties/INV-2"
          description: "Failed auth never creates a session"
          
          generators: {
            email: { type: email }
            password: { type: string, min: 1, max: 100 }
          }
          
          given: {
            one_of: [
              { mock: "user_repository.get_by_email", returns: { none: true } },
              { mock: "password_hasher.verify", returns: false },
              { mock: "rate_limiter.check", returns: { error: "RateLimited" } }
            ]
          }
          
          then: {
            assertions: [
              { type: returns_error },
              { type: mock_not_called, mock: "session_cache.store" }
            ]
          }
          
          runs: 100
        }
      ]
    }
  ]
  
  integration_tests: [
    {
      id: "auth-service-integration"
      target: "@module/user-management/services/auth-service"
      
      dependencies: {
        real: [ "users-db", "session-cache" ]
        mocked: [ "event_bus" ]
      }
      
      setup: {
        database: {
          migrations: "@module/user-management/data/migrations"
          seed: [
            {
              table: "users"
              records: [
                {
                  id: "test-user-1"
                  email: "existing@example.com"
                  password_hash: { placeholder: "hash:correct_password" }
                  status: "active"
                }
              ]
            }
          ]
        }
        cache: { flush_before_each: true }
      }
      
      cases: [
        {
          id: "full_auth_flow"
          description: "Complete authentication with real DB and cache"
          
          steps: [
            {
              action: call
              function: authenticate
              inputs: { email: "existing@example.com", password: "correct_password" }
              expect: { success: true }
              capture: { session_id: "result.id" }
            },
            {
              action: verify_state
              checks: [
                {
                  target: "session-cache"
                  query: { key: "{{session_id}}" }
                  expect: { exists: true }
                }
              ]
            },
            {
              action: call
              function: revoke_session
              inputs: { session_id: "{{session_id}}" }
              expect: { success: true }
            },
            {
              action: verify_state
              checks: [
                {
                  target: "session-cache"
                  query: { key: "{{session_id}}" }
                  expect: { exists: false }
                }
              ]
            }
          ]
        }
      ]
      
      teardown: {
        database: { truncate: [ "users", "user_sessions" ] }
        cache: { flush: true }
      }
    }
  ]
  
  e2e_tests: [
    {
      id: "auth-api-e2e"
      type: api
      target: "@module/user-management/api"
      
      environment: {
        base_url: "{{TEST_API_URL}}"
      }
      
      cases: [
        {
          id: "login_flow"
          description: "Complete login via HTTP API"
          
          steps: [
            {
              action: http_request
              method: POST
              path: "/api/v1/auth/login"
              body: { email: "testuser@example.com", password: "test_password" }
              expect: {
                status: 200
                body: {
                  session_id: { type: uuid }
                  expires_at: { type: iso8601 }
                }
              }
              capture: { session_id: "body.session_id" }
            },
            {
              action: http_request
              method: GET
              path: "/api/v1/users/me"
              headers: { Authorization: "Bearer {{session_id}}" }
              expect: { status: 200 }
            },
            {
              action: http_request
              method: POST
              path: "/api/v1/auth/logout"
              headers: { Authorization: "Bearer {{session_id}}" }
              expect: { status: 204 }
            },
            {
              action: http_request
              method: GET
              path: "/api/v1/users/me"
              headers: { Authorization: "Bearer {{session_id}}" }
              expect: { status: 401 }
            }
          ]
        }
      ]
    }
  ]
  
  ui_e2e_tests: [
    {
      id: "login-page-e2e"
      type: ui
      target: "@module/user-management/ui/login-page"
      
      browser: { headless: true }
      viewport: { width: 1280, height: 720 }
      
      cases: [
        {
          id: "successful_login_redirect"
          description: "User should be redirected to dashboard after login"
          
          steps: [
            { action: navigate, url: "/login" },
            { action: fill, selector: "[data-testid='email-input']", value: "testuser@example.com" },
            { action: fill, selector: "[data-testid='password-input']", value: "test_password" },
            { action: click, selector: "[data-testid='login-button']" },
            { action: wait_for_navigation, url: "/dashboard", timeout: "5s" },
            { action: assert, selector: "[data-testid='welcome-message']", visible: true }
          ]
        }
      ]
    }
  ]
}
```

### 4.10 Pipeline IR

Produced by: **DevOps Agent**

Defines CI/CD orchestration including build, test, and deployment.

```spec
ir::pipeline @module/user-management/pipeline {
  version: "1.0.0"
  
  meta: {
    module: @module/user-management
    created_by: DevOpsAgent
    incorporates: [
      "@module/user-management/tests",
      "@module/user-management/infrastructure"
    ]
  }
  
  triggers: [
    { type: push, branches: [ "main", "develop" ] },
    { type: pull_request, branches: [ "main" ] },
    { type: manual, environments: [ "staging", "production" ] }
  ]
  
  environments: {
    ci: {
      purpose: "Continuous integration"
      ephemeral: true
    }
    staging: {
      purpose: "Pre-production testing"
      url: "https://staging.example.com"
      approval_required: false
    }
    production: {
      purpose: "Live environment"
      url: "https://app.example.com"
      approval_required: true
      approvers: [ "team-leads", "sre" ]
    }
  }
  
  stages: [
    {
      id: "build"
      name: "Build"
      environment: ci
      
      steps: [
        { id: "checkout", action: checkout_code },
        { id: "setup", action: setup_environment },
        { id: "dependencies", action: install_dependencies, cache: { key: "deps-{{hash:lockfile}}" } },
        { id: "compile", action: compile, outputs: [ "build/artifacts" ] },
        { id: "static-analysis", action: static_analysis, fail_on: { severity: high } }
      ]
    },
    
    {
      id: "unit-tests"
      name: "Unit Tests"
      environment: ci
      depends_on: [ "build" ]
      
      steps: [
        {
          id: "run-unit-tests"
          action: run_tests
          tests: "@module/user-management/tests/unit_tests"
          coverage: { threshold: { line: 80 }, fail_under_threshold: true }
          reports: { junit: "reports/unit-tests.xml" }
        }
      ]
    },
    
    {
      id: "integration-tests"
      name: "Integration Tests"
      environment: ci
      depends_on: [ "build" ]
      
      services: {
        postgres: { image: "postgres:15", health_check: "pg_isready" }
        redis: { image: "redis:7", health_check: "redis-cli ping" }
      }
      
      steps: [
        {
          id: "run-migrations"
          action: run_migrations
          migrations: "@module/user-management/data/migrations"
        },
        {
          id: "run-integration-tests"
          action: run_tests
          tests: "@module/user-management/tests/integration_tests"
        }
      ]
    },
    
    {
      id: "build-image"
      name: "Build Container Image"
      environment: ci
      depends_on: [ "unit-tests", "integration-tests" ]
      
      steps: [
        {
          id: "docker-build"
          action: build_container_image
          tags: [ "{{registry}}/user-management:{{git_sha}}" ]
        },
        {
          id: "scan-image"
          action: scan_container_image
          fail_on: { severity: critical }
        },
        {
          id: "push-image"
          action: push_container_image
          condition: { branch: "main" }
        }
      ]
    },
    
    {
      id: "deploy-staging"
      name: "Deploy to Staging"
      environment: staging
      depends_on: [ "build-image" ]
      condition: { branch: "main" }
      
      steps: [
        {
          id: "deploy-infra"
          action: apply_infrastructure
          infra: "@module/user-management/infrastructure"
          environment: staging
        },
        {
          id: "run-migrations"
          action: run_migrations
          migrations: "@module/user-management/data/migrations"
        },
        {
          id: "deploy-app"
          action: deploy_application
          image: "{{registry}}/user-management:{{git_sha}}"
          strategy: { type: rolling, max_unavailable: "25%" }
        },
        {
          id: "smoke-tests"
          action: run_tests
          tests: { filter: "@module/user-management/tests/e2e_tests", tags: [ "smoke" ] }
        }
      ]
      
      on_failure: {
        action: rollback
        notify: [ "team-slack" ]
      }
    },
    
    {
      id: "e2e-tests-staging"
      name: "E2E Tests"
      environment: staging
      depends_on: [ "deploy-staging" ]
      
      steps: [
        {
          id: "run-e2e"
          action: run_tests
          tests: "@module/user-management/tests/e2e_tests"
        }
      ]
    },
    
    {
      id: "deploy-production"
      name: "Deploy to Production"
      environment: production
      depends_on: [ "e2e-tests-staging" ]
      
      approval: {
        required: true
        timeout: "24h"
        min_approvals: 1
      }
      
      steps: [
        {
          id: "deploy-infra"
          action: apply_infrastructure
          infra: "@module/user-management/infrastructure"
          environment: production
        },
        {
          id: "run-migrations"
          action: run_migrations
          backup_before: true
        },
        {
          id: "deploy-app"
          action: deploy_application
          strategy: {
            type: canary
            steps: [
              { weight: 10, pause: "5m" },
              { weight: 50, pause: "10m" },
              { weight: 100 }
            ]
            analysis: {
              metrics: [
                { query: "error_rate", threshold: "< 0.01" },
                { query: "latency_p99", threshold: "< 500ms" }
              ]
            }
          }
        },
        {
          id: "verify"
          action: run_tests
          tests: { tags: [ "smoke", "critical" ] }
        }
      ]
      
      on_failure: {
        action: rollback
        strategy: immediate
        notify: [ "oncall-pager" ]
      }
      
      on_success: {
        notify: [ "team-slack" ]
        tag_release: "v{{version}}"
      }
    }
  ]
  
  rollback: {
    automatic: {
      triggers: [
        { metric: "error_rate", threshold: "> 5%", window: "5m" }
      ]
    }
    manual: {
      command: "rollback"
      targets: [ "staging", "production" ]
    }
  }
  
  notifications: {
    channels: [
      { id: "team-slack", type: slack, events: [ "stage_failed", "deployment_complete" ] },
      { id: "oncall-pager", type: pagerduty, events: [ "production_failed" ] }
    ]
  }
}
```

---

## 5. IR Action Vocabulary

The function `body` uses a fixed vocabulary of semantic actions:

| Action | Purpose | Required Fields |
|--------|---------|-----------------|
| `call` | Synchronous function call | target, inputs, outputs |
| `call_async` | Fire-and-forget async call | target, inputs |
| `if` | Conditional branch | condition, then, else? |
| `if_error` | Branch on Result error | condition, then |
| `if_none` | Branch on Option none | condition, then |
| `match` | Pattern matching on variants | source, cases |
| `unwrap` | Extract value from Option/Result | source, outputs |
| `construct` | Create new struct instance | type, fields, outputs |
| `return_success` | Return successful result | value |
| `return_error` | Return error result | error |
| `propagate_error` | Re-throw error from Result | source |
| `emit_event` | Emit domain event | event, data |
| `assign` | Assign to variable | name, value |
| `loop_for` | For-each loop | collection, item, body |
| `loop_while` | While loop | condition, body |
| `break` | Exit loop | — |
| `continue` | Next iteration | — |
| `parallel` | Execute in parallel | steps |
| `sequence` | Execute in sequence | steps |

---

## 6. Expression Language

Within IR, expressions use a minimal, unambiguous syntax:

```spec
// Variables
{ var: name }

// Literals
{ literal: "string" }
{ literal: 123 }
{ literal: true }

// Field access
{ expr: "user.email" }

// Method call (pure)
{ expr: "email.to_string()" }

// Arithmetic
{ expr: "count + 1" }

// Comparison
{ expr: "count > 0" }
{ expr: "not valid" }

// Record update (immutable)
{ expr: "user with { failed_attempts: 0 }" }

// Generators
{ generate: uuid }
{ generate: now }
{ generate: now, offset: { value: 24, unit: "hours" } }

// References
{ ref: "CONSTANT_NAME" }

// Variants
{ variant: "UserStatus.Active" }
```

---

## 7. Agent Handoff Protocol

### 7.1 Handoff Structure

```spec
ir::handoff @handoffs/product-to-architect/user-management {
  id: "HO-2026-0113-001"
  
  from: { agent: ProductAgent, artifact: "@contract/user-management" }
  to: { agent: ArchitectAgent }
  
  status: accepted
  
  decided: {
    AuthenticationMethod: {
      choice: EmailPassword
      rationale: "User research showed password familiarity"
      decided_by: ProductAgent
    }
  }
  
  must_decide: [
    SessionStorageStrategy,
    PasswordHashingAlgorithm,
    EventingStrategy
  ]
  
  may_decide: [
    CacheEvictionPolicy,
    ConnectionPoolSize
  ]
  
  out_of_scope: [
    SocialAuthentication,
    TwoFactorAuth
  ]
  
  context: {
    deployment_target: Kubernetes
    tech_constraints: [ "PostgreSQL available", "Redis available" ]
  }
  
  acceptance: {
    checks: [
      "All operations mapped to services",
      "All services have defined dependencies",
      "No circular dependencies"
    ]
  }
}
```

### 7.2 Revision Requests

```spec
ir::revision @revisions/REV-2026-0113-001 {
  from: HumanReview
  to: ProductAgent
  artifact: "@contract/user-management"
  
  issues: [
    {
      id: "REV-001"
      severity: blocking
      location: "@contract/operations"
      kind: MissingCapability
      description: "Need password reset flow"
      suggested_resolution: {
        action: AddOperation
        operation: "ResetPassword(email) -> Result<void, UserNotFound>"
      }
    }
  ]
  
  on_resolution: ResubmitForReview
}
```

---

## 8. Conflict Resolution

### 8.1 Conflict Types

| Type | Example | Resolution Path |
|------|---------|-----------------|
| Impossibility | "JWT specified but revocation required" | Escalate to deciding agent |
| ConstraintViolation | "Cannot achieve latency with specified DB" | Escalate with evidence |
| Ambiguity | "Unclear what 'inactivity' means" | Clarification request |
| Suboptimality | "Works but O(n²)" | Suggest alternative |

### 8.2 Conflict Declaration

```spec
ir::conflict @conflicts/CONF-2026-0113-001 {
  reported_by: DeveloperAgent
  status: resolved
  
  contested: "@decisions/SessionStorage.Redis"
  decided_by: ArchitectAgent
  
  type: ConstraintViolation
  
  evidence: {
    claim: "Redis connection exhaustion under load"
    data: [
      { type: LoadTest, result: "Timeout at 800 users", required: 1000 }
    ]
  }
  
  resolution: {
    decided_by: ArchitectAgent
    decision: RedisCluster
    rationale: "Cleanest solution"
    invalidates: [ "@module/infrastructure/redis" ]
    reassigns: [ { agent: DevOpsAgent, task: UpdateInfrastructure } ]
  }
}
```

---

## 9. Parallel Execution

### 9.1 Task Decomposition

```spec
ir::tasks @module/user-management/tasks {
  version: "1.0.0"
  
  waves: [
    {
      id: "wave-0"
      parallel: false
      tasks: [
        { id: "TASK-001", type: types, target: "@types", dependencies: [] }
      ]
    },
    {
      id: "wave-1"
      parallel: true
      tasks: [
        { id: "TASK-002", type: interface, target: "@interfaces/user-repository", dependencies: [ "TASK-001" ] },
        { id: "TASK-003", type: interface, target: "@interfaces/session-cache", dependencies: [ "TASK-001" ] },
        { id: "TASK-004", type: interface, target: "@interfaces/password-hasher", dependencies: [ "TASK-001" ] }
      ]
    },
    {
      id: "wave-2"
      parallel: true
      tasks: [
        { id: "TASK-005", type: function, target: "@functions/authenticate", dependencies: [ "TASK-002", "TASK-003", "TASK-004" ] },
        { id: "TASK-006", type: function, target: "@functions/revoke-session", dependencies: [ "TASK-003" ] }
      ]
    }
  ]
}
```

### 9.2 Context Requirements

Each task specifies exactly what context it needs:

```spec
task: {
  id: "TASK-005"
  target: "@functions/authenticate"
  
  context_required: [
    "@types/*",
    "@interfaces/user-repository.signature",
    "@interfaces/session-cache.signature",
    "@interfaces/password-hasher.signature",
    "@interfaces/rate-limiter.signature",
    "@events/*"
  ]
  
  estimated_tokens: 1200
}
```

---

## 10. External Agent Interface

### 10.1 Handoff Package

What Spec provides to external agents:

```spec
ir::handoff_package @deployments/user-management {
  version: "1.0.0"
  
  contents: {
    types: "@module/user-management/types"
    interfaces: "@module/user-management/interfaces/*"
    functions: "@module/user-management/functions/*"
    events: "@module/user-management/events"
    infra: "@module/user-management/infrastructure"
    data: "@module/user-management/data"
    tests: "@module/user-management/tests"
    pipeline: "@module/user-management/pipeline"
  }
  
  expected_deliverables: {
    source_code: required
    tests: required
    build_config: required
    deployment_config: required
    documentation: optional
  }
  
  verification: {
    callback: "@system/verification"
    report_schema: "@schemas/verification-report"
  }
}
```

### 10.2 External Agent Contract

External agents are independent and must satisfy this interface:

```spec
interface ExternalAgent {
  // What the agent accepts
  accepts: {
    ir_version: "1.x"
    ir_types: [ types, interfaces, functions, events, infra, data, tests, pipeline ]
  }
  
  // What the agent produces
  produces: {
    source_code: true
    tests: true
    documentation: optional
  }
  
  // Contract
  methods: {
    implement(ir: IRPackage) -> Implementation
    verify(impl: Implementation, properties: Properties) -> VerificationReport
  }
}
```

### 10.3 What External Agents Decide

External agents have full authority over:

- Language syntax and idioms
- Framework and library choices
- Type mappings (UUID → java.util.UUID, etc.)
- Error handling patterns (exceptions vs Result types)
- Project structure and file organization
- Build system configuration
- Testing framework selection
- IaC tool selection (Terraform, Pulumi, etc.)
- CI/CD platform (GitHub Actions, GitLab CI, etc.)

---

## 11. Complete Example

A complete module produces:

```
@module/user-management/
│
├── contract.spec.ir                    # What the system does
├── module.spec.ir                      # Service decomposition
├── infrastructure.spec.ir              # Compute, network, storage
├── data.spec.ir                        # Database schemas
├── decisions.spec.ir                   # Architectural decisions
├── properties.spec.ir                  # Invariants and constraints
│
├── tasks.spec.ir                       # Parallelized work units
│
├── types.spec.ir                       # Shared type definitions
├── events.spec.ir                      # Domain events
│
├── interfaces/
│   ├── user-repository.spec.ir
│   ├── session-cache.spec.ir
│   ├── password-hasher.spec.ir
│   └── rate-limiter.spec.ir
│
├── functions/
│   ├── authenticate.spec.ir
│   ├── revoke-session.spec.ir
│   └── create-user.spec.ir
│
├── tests.spec.ir                       # Unit, integration, e2e specs
│
└── pipeline.spec.ir                    # CI/CD orchestration
```

External agents consume these artifacts and produce:

| External Agent | Consumes | Produces |
|----------------|----------|----------|
| Java/Spring Agent | types, interfaces, functions, events | Java source code, Gradle config |
| Terraform Agent | infrastructure | HCL files |
| Flyway Agent | data | SQL migrations |
| JUnit Agent | tests.unit_tests | Java test classes |
| Playwright Agent | tests.ui_e2e_tests | TypeScript test files |
| GitHub Actions Agent | pipeline | YAML workflows |

---

## 12. Future Work

### 12.1 Formal IR Schema

Define JSON Schema or Protocol Buffers schema for all IR types to enable:
- Validation of IR artifacts
- Code generation for IR parsers
- IDE support and autocomplete

### 12.2 IR Versioning and Migration

Define how IR evolves over time:
- Backward compatibility guarantees
- Migration paths for breaking changes
- Deprecation policies

### 12.3 External Agent Registry

A marketplace/registry for external agents:
- Agent capability declarations
- Quality ratings and reviews
- Version compatibility matrices

### 12.4 Verification Protocol

Standardize how external agents report verification results:
- Test results format
- Coverage metrics
- Static analysis findings
- Performance benchmarks

### 12.5 Incremental IR Updates

Support for partial updates to IR:
- Delta/patch format for changes
- Dependency tracking for invalidation
- Incremental re-generation

---

## Conclusion

Spec provides a complete, language-agnostic specification format for autonomous software development. By separating the **semantic specification** (what the system should do) from the **implementation details** (how it's written in a specific language), Spec enables:

1. **Specialization** — Spec agents focus on design, external agents focus on implementation
2. **Flexibility** — Any language/framework can be targeted without changing Spec
3. **Parallelization** — Work is decomposed into independent, parallelizable units
4. **Verification** — Properties and invariants enable automated testing
5. **Traceability** — Every decision is recorded from requirements to deployment

The clean handoff boundary between Spec and external agents creates a modular, extensible architecture for the future of AI-assisted software development.

---

*End of Document*
