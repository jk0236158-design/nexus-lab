---
title: Decisions as Templates
---

# Decisions as Templates

A premium template is not a bundle of code. It is a bundle of **resolved design decisions**.

When you buy the `database` template, you are not paying for ~1,000 lines of TypeScript. You are paying for:

- The decision to use Drizzle over Prisma / Kysely / raw SQL (and why).
- The decision to wrap errors through `formatDbError()` (and why a leakier default was rejected).
- The decision about migration strategy and location.
- The decision about which constraints go in the schema versus in Zod.

Each premium template's README explains **why** the decisions were made the way they were, including the alternatives considered and rejected. You are free to disagree and change them — but you start from a position where the choices are visible.

## Implication for pricing

We price premium templates on the design time we save the buyer, not on line count. A small template can be worth more than a large one if the decisions behind it took longer to get right.
