# Forky frontend

React frontend for a combined food + grocery delivery portal. Layout and flows are
inspired by common delivery apps; all branding, copy and styling here are original.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
```

## Pages

| Route | What it shows |
| --- | --- |
| `/` | Home: hero, food categories, top restaurants, grocery categories, stores |
| `/restaurants` | Restaurant listing with cuisine chips, sort and filters (fast, 4.5+, pure veg, offers) |
| `/restaurant/:slug` | Restaurant page: Menu (category nav, search, veg toggle), Reviews (with write-a-review), Photos (lightbox), Info |
| `/groceries` | Grocery landing: categories and store listing |
| `/store/:slug` | Store page: category sidebar + product grid, Reviews, Photos, Store info |
| `/cart` | Cart: address, payment, tip, coupons, bill breakdown, place order |
| `/search?q=` | Search across restaurants, dishes and grocery products |
| `/order/success` | Order confirmation |

The cart holds items from one restaurant or store at a time and asks before replacing it.
It is saved in `localStorage`.

## Connecting your backend

All data goes through `src/api/index.js`. It has a `mock` and a `real` implementation of
each call; the app uses mocks until you switch it off:

```bash
cp .env.example .env
# then edit:
VITE_API_BASE_URL=https://your-backend/api
VITE_USE_MOCK=false
```

Edit the paths in the `real` object to match your routes. The mock data in
`src/api/mock/data.js` shows the shape each screen expects (e.g. a restaurant has
`menu[] -> items[]`, `reviews[]`, `gallery[]`; a store has `categories[] -> items[]`).
If your field names differ, map them inside the `real` functions so the components stay unchanged.
Auth: `src/api/client.js` sends `Authorization: Bearer <token>` from `localStorage.forksy_token`.

Images: mocks use emoji placeholders. Real items can carry `image` (menu items, products)
or `url` (gallery entries) and the components render the photo instead.

## Stack

Vite 5, React 18, React Router 6, Tailwind CSS 3. Theme colours live in `tailwind.config.js`.
