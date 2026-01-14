# Spec IR Generator - Proof of Concept

A web-based implementation of the Spec agent pipeline that generates language-agnostic IR specifications from natural language requirements.

🚀 **[Try it live](https://mronus.github.io/spec)** | 📄 **[Read the Proposal](../spec-language-design-proposal-v0.2.md)**

## What This Does

This POC demonstrates the **Spec Domain** by orchestrating six specialized AI agents that transform requirements into complete, language-agnostic software specifications:

```
User Requirements
      ↓
   Orchestrator
      ↓
┌─────────────────────────────────────┐
│  Product Agent                      │ → contract.spec.ir
│  Defines what the system should do  │
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│  Architect Agent                    │ → module.spec.ir
│  Designs system architecture        │   infrastructure.spec.ir
│                                     │   data.spec.ir
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│  Scrum Agent                        │ → tasks.spec.ir
│  Decomposes work into tasks         │
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│  Developer Agent                    │ → types.spec.ir
│  Implements detailed logic          │   interfaces/*.spec.ir
│                                     │   functions/*.spec.ir
│                                     │   events.spec.ir
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│  Tester Agent                       │ → tests.spec.ir
│  Creates test specifications        │
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│  DevOps Agent                       │ → pipeline.spec.ir
│  Defines CI/CD orchestration        │
└─────────────────────────────────────┘
      ↓
   ZIP Download (All IR Artifacts)
```

## Getting Started

### Prerequisites

- **Node.js** v18 or later
- **npm** or **yarn**
- **API Keys** from one or both:
  - [Anthropic API](https://console.anthropic.com/) for Claude models
  - [OpenAI API](https://platform.openai.com/) for GPT models

You can mix models (e.g., Claude for execution, GPT for review).

### Installation

```bash
# Clone the repository
git clone https://github.com/mronus/spec.git
cd spec/poc

# Install dependencies
npm install
```

### Running Locally

```bash
# Start development server
npm run dev
```

The application will open at `http://localhost:5173`

### Building for Production

```bash
# Build optimized bundle
npm run build

# Preview production build
npm run preview

# Deploy (GitHub Pages example)
npm run build
# Then deploy the dist/ folder
```

## Usage Guide

### 1. Configure Your Generation

**Enter Requirements:**
- Describe the module you want to specify in natural language
- Example: `"Create a user authentication system with email/password login and session management"`
- More detail = better output

**Select Models:**
- **Executor Model**: The LLM that generates IR artifacts (does the main work)
- **Reviewer Model**: The LLM that reviews and provides feedback
- Recommendations:
  - `claude-3-7-sonnet` (best quality, higher cost)
  - `gpt-4o` (good quality, moderate cost)
  - `gpt-4o-mini` (faster, lower cost)

**Max Feedback Cycles:**
- Number of review iterations per artifact (default: 3)
- Higher = better quality but slower/more expensive

### 2. Provide API Keys

**Important: Your API keys are secure**
- ✅ Only stored in browser memory during the session
- ✅ Never persisted to disk or localStorage
- ✅ Never sent to any server except official OpenAI/Anthropic APIs
- ✅ Cleared when you close the browser

Enter:
- Anthropic API key (if using Claude models)
- OpenAI API key (if using GPT models)

### 3. Generate IR Artifacts

1. Click **"Start Generation"**
2. Watch the pipeline progress through 6 stages
3. Agents may ask clarifying questions - answer them in the dialog
4. Each artifact goes through multiple review cycles
5. Progress is auto-saved to localStorage (but not API keys)

### 4. Review & Download

Once complete:
- Review generated artifacts in the output panel
- Download ZIP file containing all `.spec.ir` files
- Use artifacts for documentation or future code generation

### 5. Resuming Sessions

If interrupted (browser crash, network issues):
- Reload the page
- Click **"Resume Generation"**
- Re-enter API keys (they weren't saved)
- Continue from where you left off

## Generated Artifacts

The POC generates these IR files:

| File | Agent | Description |
|------|-------|-------------|
| `contract.spec.ir` | Product | Entities, operations, constraints, NFRs |
| `module.spec.ir` | Architect | Services, components, dependencies |
| `infrastructure.spec.ir` | Architect | Compute, network, storage, security |
| `data.spec.ir` | Architect | Database schemas and migrations |
| `decisions.spec.ir` | Architect | Architectural decision records |
| `tasks.spec.ir` | Scrum | Parallelized task breakdown |
| `types.spec.ir` | Developer | Shared type definitions |
| `events.spec.ir` | Developer | Domain events |
| `interfaces/*.spec.ir` | Developer | Component interfaces |
| `functions/*.spec.ir` | Developer | Function implementations |
| `tests.spec.ir` | Tester | Unit, integration, e2e test specs |
| `pipeline.spec.ir` | DevOps | CI/CD pipeline definition |

All packaged in a downloadable ZIP file.

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Framework**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **LLM Integration**: Direct API calls to OpenAI & Anthropic
- **State Management**: React hooks
- **Persistence**: Browser localStorage (progress only)
- **Export**: JSZip + FileSaver

## Project Structure

```
poc/
├── src/
│   ├── agents/              # Agent implementations
│   │   ├── base-agent.ts    # Base agent with feedback loop
│   │   ├── product-agent.ts
│   │   ├── architect-agent.ts
│   │   ├── scrum-agent.ts
│   │   ├── developer-agent.ts
│   │   ├── tester-agent.ts
│   │   └── devops-agent.ts
│   │
│   ├── components/          # React UI components
│   │   ├── ConfigForm.tsx   # Initial configuration
│   │   ├── PipelineProgress.tsx
│   │   ├── OutputPanel.tsx
│   │   └── ui/              # Radix UI components
│   │
│   ├── hooks/               # React hooks
│   │   ├── useOrchestration.ts  # Main orchestration hook
│   │   └── useApiKeys.ts        # API key management
│   │
│   ├── llm/                 # LLM integration
│   │   ├── llm-client.ts    # Unified LLM client
│   │   ├── anthropic.ts     # Claude API integration
│   │   ├── openai.ts        # OpenAI API integration
│   │   ├── rate-limiter.ts  # Rate limiting logic
│   │   └── prompts/         # System prompts for agents
│   │
│   ├── orchestration/       # Pipeline orchestration
│   │   ├── orchestrator.ts  # Main orchestrator
│   │   └── pipeline.ts      # Pipeline stages
│   │
│   ├── types/               # TypeScript types
│   │   ├── spec.types.ts
│   │   ├── agent.types.ts
│   │   ├── llm.types.ts
│   │   └── orchestration.types.ts
│   │
│   ├── utils/               # Utilities
│   │   ├── storage.ts       # localStorage management
│   │   ├── zip-generator.ts # ZIP file creation
│   │   └── id-generator.ts  # ID generation
│   │
│   ├── App.tsx              # Main application
│   └── main.tsx             # Entry point
│
├── public/                  # Static assets
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Key Implementation Details

### Agent Feedback Loop

Each agent uses a multi-cycle feedback loop:

1. **Generate**: LLM generates IR artifact using executor model
2. **Review**: Reviewer model evaluates the artifact
3. **Iterate**: If not approved, incorporate feedback and regenerate
4. **Approve**: After max cycles or approval, finalize artifact

See `src/agents/base-agent.ts` for implementation.

### State Persistence

Progress is saved to localStorage after each artifact:
- Current stage
- Completed artifacts
- Module name
- Configuration (excluding API keys)

API keys are NEVER persisted for security.

See `src/utils/storage.ts` for implementation.

### LLM Integration

Supports both OpenAI and Anthropic with:
- Automatic rate limiting with exponential backoff
- Streaming support (not used in current implementation)
- Model-agnostic interface

See `src/llm/llm-client.ts` for implementation.

## Configuration

### Environment Variables

Create a `.env.local` file for development:

```bash
# Optional: Pre-fill API keys (NOT RECOMMENDED for security)
# VITE_ANTHROPIC_API_KEY=sk-ant-...
# VITE_OPENAI_API_KEY=sk-...
```

**Note**: It's better to enter keys in the UI each session.

### Customizing Agents

Modify agent prompts in `src/llm/prompts/system-prompts.ts`:

```typescript
export const PRODUCT_AGENT_PROMPT = `
You are the Product Agent...
// Customize prompt here
`;
```

### Adding New IR Types

1. Add type to `src/types/spec.types.ts`:
   ```typescript
   export type IRType = 'contract' | 'module' | 'your-new-type' | ...;
   ```

2. Update agent to output new type:
   ```typescript
   getOutputIRTypes(): IRType[] {
     return ['contract', 'your-new-type'];
   }
   ```

3. Add prompt in `src/llm/prompts/system-prompts.ts`

## Performance & Cost

### Typical Generation

For a medium-sized module (e.g., user authentication):
- **Duration**: 10-20 minutes
- **Cost**: $2-5 USD (depends on models chosen)
- **Artifacts**: ~15-20 files
- **Total tokens**: ~200k-500k

### Optimization Tips

1. **Use cheaper models for review**: GPT-4o-mini is often sufficient
2. **Reduce feedback cycles**: 2 cycles is usually enough
3. **Be specific in requirements**: Reduces back-and-forth
4. **Use caching**: Resume interrupted sessions instead of starting over

## Limitations

This is a **proof-of-concept** with known limitations:

- ❌ No formal IR schema validation
- ❌ External language agents not implemented
- ❌ No verification protocol for generated code
- ❌ Quality varies with LLM model selection
- ❌ Can be expensive for large modules
- ❌ No collaborative/multi-user support
- ❌ No version control integration

## Troubleshooting

### API Rate Limits

**Problem**: Getting rate limit errors

**Solutions**:
- Wait for rate limit to reset (automatic retry with backoff)
- Use a different model
- Upgrade your API plan

### Generation Fails Mid-Way

**Problem**: Pipeline stops with error

**Solutions**:
- Check browser console for error details
- Click "Resume" to retry from last successful stage
- Try different model configuration
- Simplify requirements

### Large Module Timeout

**Problem**: Browser tab becomes unresponsive

**Solutions**:
- Break requirements into smaller modules
- Reduce max feedback cycles
- Use faster models (GPT-4o-mini)

### API Keys Not Working

**Problem**: "Invalid API key" errors

**Solutions**:
- Verify key is correct (copy-paste carefully)
- Check API key has sufficient credits
- Ensure key hasn't expired
- Verify you're using the right provider's key

## Contributing

Contributions to the POC are welcome:

### Bug Reports
- Use GitHub Issues with `poc` label
- Include browser console logs
- Describe steps to reproduce

### Feature Requests
- Open an issue with `enhancement` label
- Describe the use case
- Explain expected behavior

### Pull Requests
- Fork the repository
- Create a feature branch
- Add tests if applicable
- Update documentation
- Submit PR with clear description

## Privacy & Security

### API Keys
- **Never stored** to localStorage or any persistent storage
- **Never sent** to any server except official OpenAI/Anthropic APIs
- Managed only in React component state
- Cleared when browser tab closes

Verify in source code:
- `src/utils/storage.ts` (lines 12, 26-32)
- `src/hooks/useApiKeys.ts`
- `src/llm/llm-client.ts`

### Data Privacy
- All processing happens **in your browser**
- No data sent to third-party servers
- Generated IR is stored **only in your browser's localStorage**
- You control when to download/share artifacts

### Open Source
- All code is open and auditable
- No telemetry or analytics
- No external tracking

## License

MIT License - See [../LICENSE](../LICENSE)

## Related

- **[Main Repository](../README.md)** - Overview and proposal
- **[Full Proposal](../spec-language-design-proposal-v0.2.md)** - Complete design document
- **[Live Demo](https://mronus.github.io/spec)** - Try without installing

---

**Questions?** Open an issue on GitHub
**Feedback?** We'd love to hear from you - open a discussion
