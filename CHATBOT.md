# Cofounder Advisor Chatbot

AI-powered chatbot that helps users understand their cofounder agreement and think through cofounder situations.

## Overview

- Embedded in the Survey page (sidebar/drawer)
- Available during and after survey completion
- Answers questions about agreements, suggests considerations
- Educational only, not legal advice

## Architecture

```
Frontend (React) --> Firebase Cloud Function --> Claude API (Anthropic servers)
                            |                          |
                    Secret Manager (API key)     They handle GPUs
                    System Prompt (from file)    You just pay per token
                    Agreement Context (per request)
                            |
                        Firestore (save chat history)
```

## No GPU Required

This is an **API-based** solution. Anthropic runs the model on their infrastructure.

- No GPU to provision or manage
- No model hosting
- No MLOps complexity
- Just API calls with pay-per-token pricing

## Tech Stack

| Component | Technology |
|-----------|------------|
| API | Anthropic Claude API (Sonnet recommended) |
| Backend | Firebase Cloud Function |
| Secrets | Firebase Secret Manager |
| Chat Storage | Firestore |
| Frontend | React component |

## File Structure

```
/functions
  /prompts
    advisorPrompt.js       # System prompt builder
  index.js                 # Cloud function (chatWithAdvisor)

/src
  /components
    AdvisorChat.js         # Chat UI component
```

## System Prompt Structure

Use XML tags for clear section delineation:

```xml
<role>
  Who the assistant is
</role>

<agreement_context>
  Dynamic: injected from current form data
</agreement_context>

<current_context>
  Dynamic: current section, completion %, recent edits
</current_context>

<instructions>
  Core behavior guidelines
</instructions>

<capabilities>
  What it CAN do
</capabilities>

<limitations>
  What it CANNOT do (legal advice, stats, mind-reading)
</limitations>

<style>
  Tone and formatting rules
</style>

<examples>
  3-5 few-shot examples (user question + ideal response)
</examples>
```

## Context Injection

Pass current form data with each request:

```xml
<agreement_context>
  <company>
    Stage, industry, funding status
  </company>
  <equity>
    Split, vesting, cliff, acceleration
  </equity>
  <roles>
    Titles, commitment levels
  </roles>
  <decision_making>
    Process, tie-breaking
  </decision_making>
  <departure_terms>
    What happens if someone leaves
  </departure_terms>
  <ip_assignment>
    IP ownership terms
  </ip_assignment>
</agreement_context>
```

## Cloud Function

**Endpoint:** `chatWithAdvisor`

**Input:**
- `message` - User's question
- `conversationHistory` - Previous messages for context
- `agreementContext` - Current form data as XML string
- `currentSection` - Which survey section user is on
- `completionPercent` - Survey progress

**Output:**
- `response` - Claude's response text
- `updatedHistory` - Conversation history with new messages

## Frontend Component

**Features:**
- Slide-out panel on right side of survey
- Message history display
- Input field with send button
- Loading state with typing indicator
- Welcome message with suggested topics
- Legal disclaimer footer

**State:**
- `messages` - Display messages
- `conversationHistory` - API format for context
- `isLoading` - Loading state
- `input` - Current input value

## Chat Data Storage

### Firestore Structure

```
projects/
  {projectId}/
    chats/
      {chatId}/
        createdAt: timestamp
        updatedAt: timestamp
        messages: [
          { role: "user", content: "...", timestamp: ... },
          { role: "assistant", content: "...", timestamp: ... }
        ]
```

### Storage Options

| Option | When to Save | Pros | Cons |
|--------|--------------|------|------|
| Every message | After each API response | No data loss | More writes, higher cost |
| On chat close | When user closes panel | Fewer writes | Could lose data if browser crashes |
| Hybrid | Every 5 messages + on close | Balanced | Slightly more complex |

### Firestore Rules

Add to `firestore.rules`:

```
match /projects/{projectId}/chats/{chatId} {
  allow read, write: if isProjectMember(projectId);
}
```

### Why Save Chat Data?

- Users can resume conversations
- Review past advice
- Analytics on common questions
- Improve prompts based on real usage

## Prompt Best Practices

1. **Keep examples focused** - 3 diverse examples better than 5 similar ones
2. **Externalize prompt** - Store in separate file, not inline
3. **Include current context** - Section + completion helps relevance
4. **Anti-hallucination** - Explicit rules about not making up statistics
5. **Response format** - Guide structure (answer, context, next step)
6. **Conversation rules** - Remember prior context, don't repeat

## Cost Considerations

### What You Pay For

| Item | Cost | Notes |
|------|------|-------|
| Claude API (Sonnet) | ~$0.01-0.02 per message | Recommended for quality |
| Claude API (Haiku) | ~$0.002-0.005 per message | Budget option |
| Firestore | ~$0.02 per 100k reads | Negligible |
| Cloud Functions | Free tier covers most usage | 2M invocations/month free |

### What You Don't Pay For

- No GPU costs
- No model hosting
- No infrastructure management
- No MLOps tooling

### Optimization Tips

- System prompt (~4k tokens) charged on every request
- Reduce examples from 5 to 3 to lower cost
- Use Haiku for simple questions, Sonnet for complex ones
- Cache system prompt in Cloud Function (already done by default)

## Setup Steps

### Anthropic Account
1. Create account at console.anthropic.com
2. Add credits (pay as you go)
3. Generate API key

### Backend
4. Install Anthropic SDK: `cd functions && npm install @anthropic-ai/sdk`
5. Add API key: `firebase functions:secrets:set ANTHROPIC_API_KEY`
6. Create `/functions/prompts/advisorPrompt.js`
7. Add `chatWithAdvisor` function to `/functions/index.js`
8. Update `firestore.rules` for chats subcollection

### Frontend
9. Create `/src/components/AdvisorChat.js`
10. Integrate into `SurveyPage.js`

### Deploy
11. Deploy: `npm run deploy:functions:dev`
12. Test in dev environment before production

## Security

- API key stored in Firebase Secret Manager (not .env)
- Auth check required (user must be logged in)
- Input validation on message
- Rate limiting (consider adding)

## Future Enhancements

- Streaming responses for better UX
- Suggested questions based on current section
- Export chat history as PDF
- Agent capabilities for form filling (if needed)
- Analytics dashboard for common questions

## ML Additions (Optional)

Small ML components to add for learning/resume value.

### Option 1: Query Classifier (Easiest)

Train a model to categorize user questions into topics.

**Categories:** equity, vesting, departure, decision-making, conflict, general

**Use case:** Route to specialized prompts or flag high-risk topics

**Stack:**
- scikit-learn (logistic regression, naive bayes) or fine-tuned DistilBERT
- 50-100 synthetic training examples (generate with Claude)
- Deploy as Cloud Function or embed in main chat function

**Implementation:**
```
User question → Classifier → Category
                               ↓
                    Select specialized prompt template
                               ↓
                         Claude API
```

### Option 2: Urgency/Risk Detector

Binary classifier to flag concerning questions that may need escalation.

**Examples:**
- "My cofounder stopped showing up" → high risk
- "What's a typical cliff period?" → normal

**Use case:** Trigger different response tone, suggest professional help

**Stack:** Same as classifier, binary output

### Option 3: RAG with Vector Search

Add retrieval-augmented generation with real sources.

**Data sources:**
- YC cofounder guides
- NVCA templates
- Common clause explanations
- Industry benchmarks

**Stack:**
- Embeddings: OpenAI text-embedding-3-small or Voyage
- Vector DB: Pinecone (free tier), Firestore vector search, or Chroma
- Retrieval: Top-k similar chunks injected into prompt

**Implementation:**
```
User question → Embed → Vector search → Top 3 relevant docs
                                              ↓
                              Inject into <context> tag
                                              ↓
                                        Claude API
```

**Tradeoff:** More impressive but more infrastructure to manage.

### Recommendation

Start with **Query Classifier**:
- Fastest to implement (weekend project)
- Teaches core ML workflow (data, train, evaluate, deploy)
- Tangible improvement to product
- Strong resume line
