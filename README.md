# 🚀 AttendEasy

**AttendEasy** is a modern, QR-based attendance and presence verification platform designed to replace slow, manual attendance processes with a fast, reliable, and proxy-resistant digital system.

🌐 **Domain:** https://attendeasy.in

---

## 📌 Problem Statement

In many colleges, attendance is still taken manually — students line up, class representatives write names, and errors or proxy attendance are common.  
This process is time-consuming, error-prone, and difficult to audit.

AttendEasy solves this problem by digitizing attendance in a way that is **fast for students**, **transparent for teachers**, and **reliable for institutions**.

---

## 💡 What AttendEasy Does

AttendEasy enables attendance using **time-locked QR codes and shared links**, ensuring only physically present students can mark attendance.

Attendance can be initiated by:

- Teachers
- Class Representatives (CRs), automatically linked to the assigned teacher

The system minimizes proxy attendance while keeping the workflow simple and efficient.

---

## ✨ Key Features

### 🎯 Smart Attendance

- One shared code per lecture — students mark in a single tap
- Time-boxed attendance windows that close on their own
- Live roster for the teacher as students mark

### 🔐 Built for Fairness

- One attendance mark per student per session
- Codes matched to a course, year and section
- Automatic session expiry
- Device-level validation (planned)

### 👥 Role-Based Workflow

- **Students:** Mark attendance and track their own record
- **Teachers:** Run sessions and review class records
- **CRs:** Take attendance on behalf of teachers
- **Admins:** Manage academic structure (future-ready)

### 🎓 College-Focused System

- Subject-wise attendance tracking
- Class, year, and section mapping
- Attendance percentage calculation
- Low-attendance insights

### 🌗 Polished Experience

- Clear, product-first interface with no technical noise
- Light / Dark mode with no screen flash on load
- Mobile-first responsive layout
- Purpose-built workspaces for teachers and students

---

## 🧠 Project Philosophy

AttendEasy is built with the belief that:

- Attendance should take seconds, not minutes
- Systems should discourage misuse without adding complexity
- Technology should adapt to real-world workflows

---

## 🛠 Tech Stack

### Frontend

- React (Vite)
- Tailwind CSS
- React Router

### Backend

- Node.js
- Express
- MongoDB with Mongoose
- JWT authentication in an httpOnly cookie

### Deployment

- AWS EC2 (Free Tier friendly)

---

---

## ⚡ Running Locally

```bash
# 1. install
npm install --prefix server
npm install --prefix client

# 2. configure
cp server/.env.example server/.env

# 3. load sample classes, teachers and students
cd server && npm run seed

# 4. start
npm run dev:server   # API
npm run dev:client   # web app
```

Sample logins for the seeded data are listed in
[docs/DEMO_CREDENTIALS.md](docs/DEMO_CREDENTIALS.md).

---

## 🐳 Running with Docker

The whole project in one command — no local installs, and the sample data is
loaded for you on the first start:

```bash
docker compose up --build
```

Then open <http://localhost:8080> and sign in with any demo account using the
password `Attend@2026`, for example
`ananya.iyer@college.edu` (teacher) or `aarav.patel@college.edu` (student).
The first boot prints every demo login to the logs:

```bash
docker compose logs app | grep -A20 "DEMO LOGIN"
```

The seed only ever writes to a database with no users in it, so restarts and
rebuilds leave your data alone. Stop everything with `docker compose down`, or
`docker compose down -v` to throw the database away as well.

The image builds the frontend and then serves it from the same Express process
that runs the API, which means the browser only ever talks to one origin and
there is no CORS or cross-site cookie involved.

| Variable        | Default                 | What it changes                                                     |
| --------------- | ----------------------- | ------------------------------------------------------------------- |
| `PORT`          | `8080`                  | Host port the app is reached on                                     |
| `JWT_SECRET`    | a placeholder           | **Change this.** Signs the login cookie                             |
| `FRONTEND_URL`  | `http://localhost:8080` | Used to build the attendance links                                  |
| `AUTO_SEED`     | `true`                  | Set to `false` to start with an empty database                      |
| `COOKIE_SECURE` | `false`                 | Set to `true` once HTTPS is in front of the container               |

Put those in a `.env` file next to `docker-compose.yml` to keep them out of
version control. `JWT_SECRET` matters: anyone who knows it can mint a login
cookie for any account.

---

## 🧩 Current Status

- ✅ Product interface complete (marketing site, sign in, teacher & student workspaces)
- ✅ Attendance sessions, live roster, records and CSV export
- ✅ Authentication with a JWT in an httpOnly cookie
- 🔄 Backend hardening and deployment
- 🔜 Real-time updates, notifications and leave management

### 📖 Documentation

| Guide                                                | What it covers                                                                                                  |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| [server/README.md](server/README.md)                 | How a request travels, every endpoint, environment                                                              |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)         | How the system is put together: the stack, the request pipeline, the data model, the API, and the known gaps    |
| [docs/SYSTEM_DESIGN.md](docs/SYSTEM_DESIGN.md)       | Why it is built this way: the constraints, the trade-offs, the security model, and what to build next          |
| [docs/INTERVIEW_GUIDE.md](docs/INTERVIEW_GUIDE.md)   | Architecture diagram, the full sign-in flow, interview questions, and the trickiest parts of the code explained |
| [docs/DEMO_CREDENTIALS.md](docs/DEMO_CREDENTIALS.md) | Sample accounts for trying the app locally                                                                      |
| [docs/QR_ROTATION_AND_SESSION_EXPIRY.md](docs/QR_ROTATION_AND_SESSION_EXPIRY.md)         | The plan for short-lived rotating QR links and reliable session expiry    |
| [docs/DEVICE_IDENTITY_AND_PROXY_PREVENTION.md](docs/DEVICE_IDENTITY_AND_PROXY_PREVENTION.md) | The plan for device binding, audit logs, and spotting proxy attendance |

---

## 🚀 Future Enhancements

- Real-time attendance updates
- Attendance export (CSV / Excel)
- Multi-college SaaS support
- Notifications & reminders
- Leave management system
- PWA & mobile support

---

## 📂 Project Structure

```
attendeasy/
├── client/            # Web app (React + Vite)
│   └── src/
│       ├── components/   # reusable UI pieces
│       ├── pages/        # one file per screen
│       ├── layouts/      # page shells: marketing, auth, dashboard
│       ├── context/      # shared state: auth, theme, toasts
│       ├── hooks/        # data fetching + polling
│       ├── lib/          # helpers, constants, types
│       └── services/     # the API client
│
├── server/            # API (Express + MongoDB)
│   └── src/
│       ├── models/       # what MongoDB stores
│       ├── controllers/  # the work each request does
│       ├── routes/       # URL -> controller
│       ├── middlewares/  # checks that run before a controller
│       ├── config/       # setup that runs once
│       ├── utils/        # small shared helpers
│       └── seed/         # demo data script
│
└── docs/              # architecture, system design, guides, demo credentials
```

Each layer only imports the layer above it, so any request can be traced by
opening four files. See [server/README.md](server/README.md) for a map of the
API.

---

## 📈 Use Cases

- Colleges & Universities
- Coaching Institutes
- Training Centers
- Corporate Workshops
- Events & Seminars

---

## 🏁 Closing Note

AttendEasy is designed as a practical, real-world solution focused on usability, reliability, and scalability.
