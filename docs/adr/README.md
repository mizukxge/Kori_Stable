# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) for the Kori Photography Platform.

## What is an ADR?

An Architecture Decision Record (ADR) captures an important architectural decision made along with its context and consequences. ADRs help teams understand:

- **Why** decisions were made
- **What** options were considered
- **When** to revisit decisions
- **How** to implement decisions

## ADR Format

Each ADR follows this structure:

1. **Title** — Descriptive name of the decision
2. **Status** — Proposed, Accepted, Deprecated, Superseded
3. **Context** — Problem statement and background
4. **Options Considered** — Alternative approaches evaluated
5. **Decision** — Chosen approach and rationale
6. **Consequences** — Positive, negative, and neutral outcomes
7. **Implementation Notes** — Technical guidance

## Active ADRs

| ID | Title | Status | Date | Area |
|----|-------|--------|------|------|
| [001](./001-delivery-substrate.md) | Media Delivery Substrate Architecture | Accepted | 2025-10-20 | Infrastructure |

## Creating a New ADR

1. Copy the template (if exists) or follow the format of existing ADRs
2. Number sequentially (next available number)
3. Use descriptive kebab-case filenames: `NNN-short-title.md`
4. Update this index with a link to the new ADR
5. Submit for review via pull request

## Decision Status Definitions

- **Proposed** — Under discussion, not yet decided
- **Accepted** — Approved and currently in effect
- **Deprecated** — No longer recommended, but not yet replaced
- **Superseded** — Replaced by a newer decision (link to successor)

## ADR Topics in Kori

- **Infrastructure** — Hosting, delivery, scaling
- **Security** — Authentication, authorization, data protection
- **Database** — Schema design, migrations, performance
- **API** — Route design, versioning, contracts
- **Frontend** — Framework choices, state management, UX patterns
- **Integration** — Third-party services, webhooks, APIs

## References

- [ADR Process by Michael Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [ADR GitHub Organization](https://adr.github.io/)
- [When to use ADRs](https://github.com/joelparkerhenderson/architecture-decision-record)

---

_Last updated: 2025-10-20_