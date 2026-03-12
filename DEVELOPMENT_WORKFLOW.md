# RentFlow Development Workflow & Best Practices

A comprehensive development workflow designed for efficiency, code quality, and team collaboration.

---

## 1. Daily Development Workflow

### Morning Standup (Daily)
**Time**: 9:00 AM (15 min)  
**Format**: Brief sync on blockers and priorities

- What we completed yesterday
- What we're working on today
- Any blockers/help needed

### Development Session Structure
1. **Planning** (5-10 min) - Pick ONE task from the current phase
2. **Implementation** (2-4 hours) - Code with focused effort
3. **Testing** (30 min) - Manual test + run test suite
4. **Code Review** (30 min) - Peer review before merge
5. **Documentation** (10 min) - Update relevant docs

### End of Day Standup (Optional)
- Sync progress before leaving
- Flag any critical blockers for tomorrow

---

## 2. Git & Branching Strategy

### Branch Naming Convention
```
feature/<feature-name>      # New features (e.g., feature/tenant-signup)
bugfix/<bug-name>           # Bug fixes (e.g., bugfix/payment-reconciliation)
chore/<task-name>           # Chores (e.g., chore/upgrade-dependencies)
docs/<doc-name>             # Documentation (e.g., docs/api-guide)
```

### Commit Message Format
```
<type>(<scope>): <subject>

<body>
<footer>
```

**Examples:**
```
feat(auth): implement role-based login with Supabase

- Add login form component
- Integrate Supabase Auth
- Redirect based on user role (landlord/agent/tenant)

Closes #123
```

```
fix(payments): handle failed Stripe transactions

- Add retry logic for failed payments
- Send notification to user
- Update payment status in DB

Closes #456
```

**Types**: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`

### Pull Request Workflow

1. **Create branch from `main`**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/my-feature
   ```

2. **Develop feature with commits**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

3. **Keep branch updated**
   ```bash
   git fetch origin
   git rebase origin/main
   ```

4. **Push and open PR**
   ```bash
   git push origin feature/my-feature
   # Open PR on GitHub with template below
   ```

5. **PR Template** (use this for all PRs)
   ```markdown
   ## Description
   Brief summary of changes

   ## Type of Change
   - [ ] New feature
   - [ ] Bug fix
   - [ ] Breaking change
   - [ ] Documentation update

   ## Related Issue
   Closes #<issue_number>

   ## Testing
   How did you test this? (manual steps or test cases)

   ## Screenshots (if applicable)
   Add before/after screenshots

   ## Checklist
   - [ ] Code follows project style guidelines
   - [ ] Self-review completed
   - [ ] Comments added for complex logic
   - [ ] Documentation updated
   - [ ] No new warnings or console errors
   - [ ] Tests pass locally
   ```

6. **Code Review**
   - At least 1 approval before merge
   - Assign reviewers to related apps/packages
   - Request changes if issues found

7. **Merge & Deploy**
   ```bash
   # Squash-merge for cleaner history
   git merge --squash feature/my-feature
   git push origin main
   # Triggers automatic deployment
   ```

---

## 3. Feature Development Lifecycle

### Phase: Planning
- [ ] Break feature into small tasks (1-2 day each)
- [ ] Write acceptance criteria
- [ ] Estimate story points
- [ ] Plan which app(s) affected (mobile/web/shared)

### Phase: Design
- [ ] Sketch UI mockup (use Figma or paper)
- [ ] Plan data model changes
- [ ] Identify API endpoints needed
- [ ] Review with team

### Phase: Development
- [ ] Create feature branch
- [ ] Implement backend (Supabase) first
- [ ] Build shared layer (types, schemas, API client)
- [ ] Implement UI (mobile/web)
- [ ] Write unit/integration tests

### Phase: Testing
- [ ] Manual test on mobile (iOS + Android)
- [ ] Manual test on web
- [ ] Test edge cases (errors, offline, slow network)
- [ ] Run full test suite
- [ ] Performance check (mobile app size, load times)

### Phase: Review
- [ ] Self-review code before submitting PR
- [ ] Address reviewer feedback
- [ ] Document any gotchas or assumptions

### Phase: Merge & Release
- [ ] Get PR approval
- [ ] Merge to main
- [ ] Verify deployment to staging
- [ ] Prepare release notes
- [ ] Tag release when deploying to production

---

## 4. Code Quality Standards

### TypeScript Strictness
- All files must have `"strict": true`
- No `any` types allowed (use `unknown` if necessary)
- Enable `noUnusedLocals` and `noUnusedParameters`

### Linting & Formatting
```bash
# Before committing
pnpm lint      # Check for issues
pnpm format    # Auto-fix formatting

# Run in pre-commit hook automatically
```

### Code Review Checklist
- [ ] **Correctness**: Does the code do what it's supposed to?
- [ ] **Performance**: Any N+1 queries? Unnecessary re-renders?
- [ ] **Security**: Any SQL injection, XSS, or auth issues?
- [ ] **Maintainability**: Is code clear and well-structured?
- [ ] **Tests**: Is logic sufficiently tested?
- [ ] **Documentation**: Are complex parts explained?

### Component Guidelines

**React Components**
```typescript
// apps/web/src/components/PropertyCard.tsx
import { FC } from 'react'

interface PropertyCardProps {
  propertyId: string
  name: string
  address: string
  monthlyRent: number
  onSelect?: (id: string) => void
}

/**
 * Displays a property listing card with key information.
 * Used in PropertyList and landlord dashboard.
 */
const PropertyCard: FC<PropertyCardProps> = ({
  propertyId,
  name,
  address,
  monthlyRent,
  onSelect,
}) => {
  return (
    <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
      <h3 className="font-semibold text-lg text-forest-500">{name}</h3>
      <p className="text-charcoal-600">{address}</p>
      <p className="text-sage-700 font-bold mt-2">KES {monthlyRent.toLocaleString()}</p>
      <button
        onClick={() => onSelect?.(propertyId)}
        className="mt-3 w-full btn-primary"
      >
        View Details
      </button>
    </div>
  )
}

export default PropertyCard
```

**React Native Components**
```typescript
// apps/mobile/src/components/PropertyCard.tsx
import { View, Text, Pressable } from 'react-native'
import { FC } from 'react'

interface PropertyCardProps {
  propertyId: string
  name: string
  address: string
  monthlyRent: number
  onSelect?: (id: string) => void
}

const PropertyCard: FC<PropertyCardProps> = ({
  propertyId,
  name,
  address,
  monthlyRent,
  onSelect,
}) => {
  return (
    <Pressable
      onPress={() => onSelect?.(propertyId)}
      className="p-4 border border-sage-200 rounded-lg mb-3 bg-white"
    >
      <Text className="font-semibold text-lg text-forest-500">{name}</Text>
      <Text className="text-charcoal-600">{address}</Text>
      <Text className="text-sage-700 font-bold mt-2">KES {monthlyRent.toLocaleString()}</Text>
    </Pressable>
  )
}

export default PropertyCard
```

---

## 5. Testing Strategy

### Unit Tests
```bash
# Run tests for specific app
pnpm test --filter @rentflow/web
pnpm test --filter @rentflow/mobile
```

**Test file naming**: `*.test.ts` or `*.test.tsx`

**Example test**:
```typescript
// utils/formatCurrency.test.ts
import { describe, it, expect } from 'vitest'
import { formatCurrency } from './formatCurrency'

describe('formatCurrency', () => {
  it('should format number as KES currency', () => {
    expect(formatCurrency(5000)).toBe('KES 5,000')
  })

  it('should handle decimals', () => {
    expect(formatCurrency(5000.50)).toBe('KES 5,000.50')
  })

  it('should handle zero', () => {
    expect(formatCurrency(0)).toBe('KES 0')
  })
})
```

### Integration Tests
- Test feature flows end-to-end
- Mock Supabase responses
- Test error handling

### Manual Testing Checklist
Before submitting PR, manually test:
- [ ] Feature works on latest iOS device/simulator
- [ ] Feature works on latest Android device/emulator
- [ ] Feature works on web (Chrome, Safari)
- [ ] responsiveness on mobile, tablet, desktop
- [ ] Offline mode (mobile only)
- [ ] Error states (failed requests, validation)
- [ ] Loading states
- [ ] No console errors or warnings

### Coverage Goals
- Unit Tests: 80%+ coverage for shared logic
- Integration Tests: Core user flows
- E2E Tests (future): Critical paths only

---

## 6. Deployment Pipeline

### Environments

| Environment | Branch | Purpose | Data |
|------------|--------|---------|------|
| **Local** | feature/* | Development | Local DB |
| **Staging** | main (merged PRs) | Pre-prod testing | Staging DB |
| **Production** | tagged releases | Live users | Production DB |

### Web Deployment (Vercel)
```bash
# Automatic on push to main
# Vercel detects apps/web/package.json

# Manual trigger (if needed)
vercel deploy --prod
```

### Mobile Deployment (EAS)

**Preview Build** (test on device):
```bash
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

**Production Build**:
```bash
eas build --platform ios
eas build --platform android
eas submit --platform ios
eas submit --android
```

### Database Migrations
```bash
# Use Supabase SQL editor for migrations
# Always test on staging first

# Create named migration
CREATE MIGRATION add_complaint_types

# Version control
# migrations/001_initial_schema.sql
# migrations/002_add_complaint_types.sql
```

### Rollback Procedure
1. If critical issue in production:
   ```bash
   git revert <commit-hash>
   git push origin main
   # Triggers automatic re-deployment
   ```

2. For database issues:
   - Revert latest migration in Supabase
   - Restore from backup if needed
   - Notify team

---

## 7. Documentation Standards

### Code Documentation
- All public functions/components have JSDoc comments
- Complex logic has inline explanations
- **Why** is more important than **what**

```typescript
/**
 * Calculates late fees based on days overdue and lease terms.
 * 
 * @param daysOverdue - Number of days payment is late
 * @param monthlyRent - Original monthly rent amount
 * @param feePercentage - Late fee percentage (default 5%)
 * @returns Calculated late fee amount
 * 
 * @example
 * calculateLateFee(5, 10000, 5) // Returns 500
 */
function calculateLateFee(
  daysOverdue: number,
  monthlyRent: number,
  feePercentage: number = 5
): number {
  return (monthlyRent * feePercentage) / 100
}
```

### README Files
- **Project README**: Overview, setup, structure
- **Feature README**: How to use a feature, architecture decisions
- **API README**: Endpoints, auth, examples

### API Documentation
Use Swagger/OpenAPI for API endpoints (when building custom API):
```typescript
/**
 * @swagger
 * /api/properties/{id}:
 *   get:
 *     summary: Get property details
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *     responses:
 *       200:
 *         description: Property object
 */
```

### Decision Logs
Document significant architectural decisions:

```markdown
# Architecture Decision Record: State Management

**Date**: 2026-03-12  
**Status**: Accepted  

## Problem
App needs client-state management for caching user preferences and form state.

## Options Considered
1. Redux - Powerful but boilerplate heavy
2. Zustand - Lightweight, simple API
3. Jotai - Atom-based, more granular

## Decision
Use **Zustand** for simplicity and minimal boilerplate.

## Rationale
- Smaller bundle size
- Easier to learn for new team members
- Sufficient for MVP scope
- Can migrate to Redux later if needed

## Consequences
- Less time spent on state setup
- More straightforward debugging
```

---

## 8. Dependency Management

### Adding Dependencies
```bash
# For shared package
pnpm add package-name --filter @rentflow/shared

# For web app
pnpm add package-name --filter @rentflow/web

# For mobile app
pnpm add package-name --filter @rentflow/mobile

# For monorepo root (dev tools only)
pnpm add -D package-name -w
```

### Version Policy
- **Major versions**: Require team discussion
- **Minor versions**: Can be auto-updated
- **Patch versions**: Should be auto-updated via Dependabot

### Security
```bash
# Check for vulnerabilities
pnpm audit

# Fix automatically if possible
pnpm audit --fix

# Review high/critical issues before updating
```

---

## 9. Performance Monitoring

### Web App
- PageSpeed Insights (target: 90+)
- Bundle size (target: <300KB gzipped)
- Time to Interactive (target: <2s)
- Monitor with Vercel Analytics

### Mobile App
- App size (target: <100MB)
- Memory usage (target: <300MB)
- Startup time (target: <2s)
- Frame rate (target: 60fps for animations)

### Database
```sql
-- Monitor slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
WHERE mean_time > 100 
ORDER BY mean_time DESC;
```

---

## 10. Communication & Escalation

### Team Channels
- **Slack #development**: Daily updates, questions
- **Slack #blockers**: Critical issues needing immediate help
- **Slack #devops**: Deployment and infrastructure issues
- **Weekly standup**: Full team sync (Zoom/in-person)

### Blocking Issues Protocol
1. **Assess severity**:
   - 🔴 **Critical**: App down, data loss, security issue
   - 🟠 **High**: Feature broken, major regression
   - 🟡 **Medium**: Minor bug, performance issue
   - 🟢 **Low**: Enhancement, nice-to-have

2. **Critical Issues**:
   - Post in #blockers channel
   - Ping tech lead immediately
   - Have a fix or rollback plan ready

3. **Resolution**:
   - Document root cause
   - Add test case to prevent recurrence
   - Post mortem if critical

### Code Review Response Time
- Critical reviews: < 2 hours
- Normal reviews: < 24 hours
- Feedback: Constructive, not critical

---

## 11. Weekly Cadence

### Monday: Sprint Planning
- [ ] Review completed tasks
- [ ] Pick tasks for the week
- [ ] Identify dependencies
- [ ] Update WORKFLOW.md progress

### Wednesday: Mid-Week Sync
- [ ] Check progress vs plan
- [ ] Adjust if needed
- [ ] Unblock any issues

### Friday: Retro + Demo
- [ ] Demo completed features
- [ ] Discuss what went well
- [ ] Discuss what needs improvement
- [ ] Plan for next week

### End of Week: Documentation
- [ ] Update README if needed
- [ ] Write any feature guides
- [ ] Tag any releases

---

## 12. Onboarding Checklist for New Team Members

- [ ] Clone repo: `git clone ...`
- [ ] Install deps: `pnpm install`
- [ ] Set up env: `cp .env.example .env.local`
- [ ] Run locally: `pnpm dev`
- [ ] Read DATABASE_SCHEMA.md
- [ ] Read WORKFLOW.md
- [ ] Pair program with existing dev
- [ ] Make first commit (docs fix or small feature)
- [ ] Submit first PR for review

---

## 13. Success Metrics

### Development Velocity
- ✅ Features completed per sprint
- ✅ PR review time < 24 hours
- ✅ > 80% test coverage on new code

### Code Quality
- ✅ No TypeScript errors
- ✅ ESLint passes on all commits
- ✅ Code review approval rate > 90%

### Production Stability
- ✅ Uptime > 99.9%
- ✅ User-reported bugs < 5 per week
- ✅ Performance metrics maintained

### Team Satisfaction
- ✅ Retrospective feedback positive
- ✅ Zero burnout signals
- ✅ Knowledge shared across team

---

## Quick Reference

### Common Commands
```bash
# Start development
pnpm dev

# Build all apps
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint

# Format code
pnpm format

# Type check
pnpm type-check

# Check dependencies for security issues
pnpm audit
```

### Useful Git Aliases
```bash
git config --global alias.co "checkout"
git config --global alias.br "branch"
git config --global alias.ci "commit"
git config --global alias.st "status"
git config --global alias.unstage "reset HEAD --"
git config --global alias.last "log -1 HEAD"
git config --global alias.visual "log --graph --oneline --all"
```

### Troubleshooting
```bash
# Clear pnpm cache
pnpm store prune

# Reinstall all dependencies
pnpm install --force

# Reset git to origin/main
git reset --hard origin/main

# See what changed in last commit
git show
```

---

**This workflow is living documentation.** Update it as the team learns what works best. Review and refine quarterly.
