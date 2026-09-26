# Wordlstreet Prediction Marketplace

Standalone React and TypeScript prediction market app, including sports markets, market details, positions, rankings, activity, and perpetuals.

## Development

Requires Node.js 22.18+ and npm.

```sh
npm ci
npm run dev
```

## Verify and build

```sh
npm test
npm run build
npm run preview
```

Production output is in `dist/`. Configure hosting to serve `index.html` for client-side routes; a Vercel configuration is included.

This app uses demo market data and local browser state. It does not execute real trades or connect to a production exchange.

Extracted from the current WorldStreet sandbox working tree, including its latest uncommitted prediction-market changes. Shared components and styles required by the app are included. Third-party chart attribution is in `src/prediction-app/ROSENCHARTS-LICENSE.txt`.
