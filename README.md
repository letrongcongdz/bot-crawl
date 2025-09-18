# Bot & Source Project

This repository contains:

- **Bot** located at `src/bot/index.ts`
- **Source app** located at `src/index.ts`

Both use environment variables for configuration and can be run locally using `nodemon` or `tsx`.

## Prerequisites

- Node.js >= 18
- npm >= 9
- Git
- Optional: `nodemon` for auto-restart during development

## Setup

### Clone the repository

```bash
git clone https://github.com/letrongcongdz/bot-crawl
cd bot-crawl
```

### Install dependencies

```bash
npm install
```

### Create environment file

Create a `.env` file in the root directory:

````env
# Bot token
APPLICATION_TOKEN=your_mezon_bot_token_here

### Install nodemon globally (optional)

```bash
npm install -g nodemon
````

## Running the Source App (TypeScript)

The source app uses TypeScript and tsx for execution.

### Run once

```bash
npx tsx src/index.ts
```

### Run with automatic restart (development)

```bash
npx nodemon --watch 'src/**/*.ts' --exec 'npx tsx' src/index.ts
```

### Install tsx

```bash
npm install -D tsx
```

## Environment Variables

| Variable            | Description         |
| ------------------- | ------------------- |
| `APPLICATION_TOKEN` | Token for Mezon bot |

## Notes

- The bot will post company reviews as cards and can be extended to reply to messages
- Ensure your API returns the correct JSON structure for companies and posts
- **Development workflow:**
  - Update code → nodemon or tsx reloads automatically
  - Use `.env` to switch between local/dev/prod endpoints

## Recommended Tools

- Node.js >= 18
- VSCode + Prettier
- Git
- Postman (for testing API)
