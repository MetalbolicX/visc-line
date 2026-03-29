---
name: 'readme-writer'
description: 'Creates and writes professional README.md files for software projects.
Use when user asks to "write a README", "create a readme", "document this project",
"generate project documentation", or "help me write a README.md". Works from a
project description, existing code, or both.'
---

# README Writer

## Overview

Generate a complete, professional README.md file and write it to disk. The output should be clear enough for a first-time contributor to understand the project, set it up locally, and start contributing.

## Step 1: Gather project context

Look for context in the codebase before asking the user:

```bash
ls -la
cat package.json 2>/dev/null || cat pyproject.toml 2>/dev/null || \
  cat go.mod 2>/dev/null || echo "No manifest found"
ls .env.example .env.sample 2>/dev/null || echo "No env example found"
```

Gather:

- What does this project do? (1-2 sentence summary)
- What language and main frameworks does it use?
- How do you install and run it?
- Are there environment variables needed?
- Is there a LICENSE file?

## Step 2: Write the README

Use similar structures like the [example 1](references/README-example-1.md) and [example 2](references/README-example-2.md). Only include sections that are relevant. Do not add empty sections.

**Important** always respond the next questions. The information comes from the project context you gathered in Step 1, so be sure to research the codebase before asking:
1.What resolves the project? What problem does it solve?

- _Bad answer_: "This a dashboard for monitoring sales." (too vague).
- _Good answer_: "This project is a dashboard for monitoring sales per store in Mexico city, allowing sales teams to quickly identify the product with less rotation to optimize inventory, so that marketing can create a promo." (specific and detailed).

2. Who is the target user? What value does it provide to them?

- _Bad answer_: "The target user is a sales manager." (too vague).
- _Good answer_: "The supply chain team manager in charge of inventory communicates with the sales team to identify slow-moving products. The value it provides is the reduction of time (2 h per day) and space (10 m² per store)." (specific and detailed).

3. Why is the reason of the selected technology stack? How does it help solve the problem?

- _Bad answer_: "The project uses React and Node.js because they are popular." (too vague).
- _Good answer_: "The project uses Golang for the backend because it provides high performance and efficient concurrency handling, which is crucial for processing large volumes of sales data in real-time. The frontend uses React to create a dynamic and responsive user interface, allowing users to interact with the dashboard seamlessly." (specific and detailed).

**Short questions**: Does the project solve a real life problem? Who is this for? Why does it use the selected technology stack? This answer can be catchy and concise, but it should be specific and detailed enough to give a clear picture of the project. Apply the:

> SHOW DON'T TELL

## Step 3: Write the file to disk

Once the content is ready, write it:

```bash
cat > README.md << 'EOF'
[full readme content]
EOF
```

Confirm it was written:

```bash
echo "README.md written: $(wc -l < README.md) lines"
```

## Step 4: Quality check

Before finishing, verify:

- [ ] No placeholder text like "[your description here]" remains
- [ ] Every command in the Installation section is accurate for this project
- [ ] Prerequisites match what the project actually needs
- [ ] License section matches the LICENSE file if one exists
- [ ] Add emojis to enhance readability and engagement, but use them sparingly (1-2 per section) and ensure they are relevant to the content.
