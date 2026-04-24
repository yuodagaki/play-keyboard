---
name: write-a-prd
description: Create a PRD through user interview, codebase exploration, and module design, then submit as a GitHub issue. Use when user wants to write a PRD, create a product requirements document, or plan a new feature.
---

This skill will be invoked when the user wants to create a PRD.

1. Ask the user for a long, detailed description of the problem they want to solve and any potential ideas for solutions.
2. Explore the repo to verify their assertions and understand the current state of the codebase.
3. Interview the user relentlessly about every aspect of this plan until you reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one.
4. Sketch out the major modules you will need to build or modify to complete the implementation. Actively look for opportunities to extract deep modules that can be tested in isolation.
5. Once you have a complete understanding, write the PRD using the template below and submit as a GitHub issue.

<prd-template>
## Problem
The problem that the user is facing, from the user's perspective.

## Solution
The solution to the problem, from the user's perspective.

## User Stories
A LONG, numbered list of user stories in the format:
As a <actor>, I want a <feature>, so that <benefit>

## Implementation Decisions
A list of implementation decisions that were made.
Do NOT include specific file paths or code snippets.

## Testing Decisions
A list of testing decisions. Include what makes a good test for this feature.

## Out of Scope
A description of things that are out of scope for this PRD.

## Notes
Any further notes about the feature.
</prd-template>