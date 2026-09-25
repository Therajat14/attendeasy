# AttendEasy frontend

React 19, Vite 7 and Tailwind CSS 4, written in plain JavaScript (`.jsx` and
`.js`). The login token lives in an HTTP-only cookie, so there is no token in
`localStorage` and no axios interceptor.

## Commands

```bash
npm install     # install dependencies
npm run dev     # start the dev server on http://localhost:5173
npm run build   # production build into dist/
npm run preview # preview the production build
npm run lint    # ESLint
npm run format  # Prettier, writing changes
```

## Where things live

| Folder                      | What goes there                                                  |
| --------------------------- | ---------------------------------------------------------------- |
| `src/pages`                 | One file per screen, for example `Login.jsx`                     |
| `src/layouts`               | Shared page frames: marketing, auth, and the signed-in dashboard |
| `src/components/ui`         | Small reusable pieces: Button, Card, Field, Badge, Alert         |
| `src/components/common`     | Pieces used by the layouts: sidebar, top bar, footer             |
| `src/components/attendance` | The attendance QR code and its full-screen view                  |
| `src/context`               | `AuthContext`, `ThemeContext` and `ToastContext`                 |
| `src/hooks`                 | `useSessions` and `useStudentAttendance`, the two polling hooks  |
| `src/lib`                   | Formatting helpers, friendly error messages, and constants       |
| `src/services`              | `api.js`, the single axios instance every request goes through   |
| `src/routes`                | `AppRoutes.jsx`, which maps URLs to pages                        |

## Environment

`VITE_API_BASE_URL` sets the API address. It defaults to `/api`, and the local
`.env` points it at `http://localhost:5000/api`.

## ESLint note

`no-unused-vars` is switched off in `eslint.config.js`. ESLint's own version of
that rule cannot tell that `<Logo />` counts as using the `Logo` import, so it
would report every JSX component as unused. The rule that understands JSX comes
from `eslint-plugin-react`, which this project does not use. `react-hooks` and
`react-refresh` rules are still active.
