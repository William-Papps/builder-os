# Builder OS

Private AI project command center. Plan software ideas through conversation, generate SDLC specs, create locked task packets, and dispatch to AI agents via sandbox.

## API Key Setup

Builder OS uses OpenAI and Anthropic Claude for the planner conversation.

1. Copy the example env file:
   ```
   copy .env.example .env.local
   ```

2. Fill in your keys in `.env.local`:
   ```
   OPENAI_API_KEY=sk-...
   ANTHROPIC_API_KEY=sk-ant-...
   ```

3. Restart the dev server — env changes are not hot-reloaded.

**Provider routing:**
- `Brainstorm` mode → OpenAI `gpt-4o-mini` (faster, cheaper)
- `SDLC`, `Task Packet`, `Review` modes → Claude `claude-sonnet-4-6` (more capable)
- Falls back to whichever key is available if only one is configured

**API keys are never exposed to the browser.** All provider calls are server-side only (`app/api/planner-chat/route.ts`).

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
