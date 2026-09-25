# Backend

The API. Express + MongoDB, written in plain ES modules with no build step —
edit a file, restart with `npm run dev`, and it just runs.

## Start it

```bash
npm run seed     # load sample classes, teachers and students (first time only)
npm run dev      # http://localhost:5000
```

Sample logins: [../docs/DEMO_CREDENTIALS.md](../docs/DEMO_CREDENTIALS.md)

## How a request travels

Every request moves through the same four files. Take `POST /api/attendance/start`:

```
server.js        starts the app, once
  └─ app.js      decides which route file handles the URL
       └─ routes/attendance.routes.js   "POST /start"  ->  which function
            └─ middlewares/auth.middleware.js        "is this person signed in?"
                 └─ controllers/attendance.controller.js   does the work, sends the reply
                      └─ models/Attendance.model.js    the shape of the data in MongoDB
```

To follow any request, open those four files and read them top to bottom. There
is no framework magic, no dependency injection, and no service layer to hunt
through.

## Folders

| Folder         | What lives there                   | Rule                                     |
| -------------- | ---------------------------------- | ---------------------------------------- |
| `models/`      | Mongoose schemas                   | One file per thing stored in MongoDB     |
| `controllers/` | The actual work                    | One file per feature, named after it     |
| `routes/`      | URL to controller mapping          | No logic, just wiring                    |
| `middlewares/` | Code that runs before a controller | Sign-in check, rate limit, error handler |
| `config/`      | Setup that runs once               | Database connection                      |
| `utils/`       | Small helpers reused across files  | Token signing, cookie settings           |
| `seed/`        | Demo data script                   | Never imported by the app                |

Each folder depends only on the ones above it in that table. A controller can
import a model; a model imports nothing of ours. Nothing imports a controller
except its route file. That is why you can open any file and know exactly what
it touches.

## Files worth reading first

| File                                 | Why                                             |
| ------------------------------------ | ----------------------------------------------- |
| `src/server.js`                      | The whole boot sequence, 22 lines               |
| `src/app.js`                         | Every route the API has, on one screen          |
| `src/routes/auth.routes.js`          | Smallest complete example of the four-file flow |
| `src/controllers/auth.controller.js` | Register, login, logout, and who am I           |
| `src/utils/authCookie.util.js`       | The one place cookie options are defined        |

## The API

| Method | URL                               | Who       | What it does                            |
| ------ | --------------------------------- | --------- | --------------------------------------- |
| POST   | `/api/auth/register`              | anyone    | Create an account                       |
| POST   | `/api/auth/login`                 | anyone    | Sign in, sets the login cookie          |
| GET    | `/api/auth/me`                    | signed in | Current user                            |
| POST   | `/api/auth/logout`                | anyone    | Clear the login cookie                  |
| POST   | `/api/attendance/start`           | teacher   | Open a 30 minute session                |
| POST   | `/api/attendance/mark/:token`     | student   | Mark attendance using the link          |
| GET    | `/api/attendance/live`            | student   | Lectures running right now for my class |
| GET    | `/api/attendance/student/history` | student   | My attendance record                    |
| GET    | `/api/attendance`                 | teacher   | All my sessions                         |
| GET    | `/api/attendance/date/:date`      | teacher   | Sessions on one day                     |
| GET    | `/api/attendance/:id`             | teacher   | One session with its roster             |
| PATCH  | `/api/attendance/:id/end`         | teacher   | Close a session early                   |

Protected routes need the login cookie. There is no `Authorization` header and
the frontend never sees the token, because it is sent as an `httpOnly` cookie
that page JavaScript cannot read.

| Cookie setting | Why                                                                 |
| -------------- | ------------------------------------------------------------------- |
| `httpOnly`     | A successful XSS cannot read the token out of the cookie            |
| `sameSite`     | `lax` stops other sites from sending the cookie with their requests |
| `secure`       | Only sent over HTTPS, and only outside development                  |
| `maxAge`       | 7 days, matching the lifetime inside the token                      |

## Environment

Copy `.env.example` to `.env`:

| Key            | Meaning                            |
| -------------- | ---------------------------------- |
| `PORT`         | Port the API listens on            |
| `MONGO_URI`    | Where the database lives           |
| `JWT_SECRET`   | Secret used to sign tokens         |
| `FRONTEND_URL` | Used to build the attendance links |

## Formatting

```bash
npm run format          # rewrite files in place
npm run format:check    # fail if anything is unformatted
```
