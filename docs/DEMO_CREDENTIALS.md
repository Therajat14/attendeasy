# Demo Credentials

Sample data for trying AttendEasy locally. Run the seed first:

```bash
cd server
npm run seed
```

The seed prints these details in the terminal as well.

> The seed refuses to run if the database already has users, so it will not
> wipe anything by accident. Pass `--force` when you really want a clean slate:
>
> ```bash
> npm run seed -- --force
> ```
>
> **Check which database you are about to seed.** `server/.env` may point at a
> shared MongoDB Atlas cluster — `--force` there deletes every user and
> attendance record in it.

## Password

Every account below uses the same password:

```
Attend@2026
```

Login is by **email address** — there is no separate user ID.

## Teacher

| Email                     | Name              | What you get                          |
| ------------------------- | ----------------- | ------------------------------------- |
| `ananya.iyer@college.edu` | Dr. Ananya Iyer   | Live session running, 6 past sessions |
| `rahul.verma@college.edu` | Prof. Rahul Verma | 6 past sessions                       |
| `sunita.nair@college.edu` | Dr. Sunita Nair   | Clean slate, good for a first run     |

## Student

BCA · 2nd Year · Section A (the section with the live session):

| Roll | Email                      |
| ---- | -------------------------- |
| 01   | `aarav.patel@college.edu`  |
| 02   | `rohan.mehta@college.edu`  |
| 03   | `isha.sharma@college.edu`  |
| 04   | `kabir.nair@college.edu`   |
| 05   | `ananya.gupta@college.edu` |
| 06   | `vivaan.joshi@college.edu` |

The seed also creates 18 more students across BCA Section B and BTech
Section A, so you can check that a student from another class is correctly
blocked from a session.

## Class representative

| Email                     | Class                      |
| ------------------------- | -------------------------- |
| `karan.mehta@college.edu` | BCA · 2nd Year · Section A |
| `priya.singh@college.edu` | BCA · 2nd Year · Section B |

## What the seed creates

- 3 teachers, 2 class representatives, 24 students
- 12 finished sessions spread over the last two weeks
- 1 live session (BCA · 2nd Year · Section A) open for 30 minutes, already
  marked by 4 students
- A live attendance link, printed at the end of the seed run

## Things worth trying

| Try this                                         | Expected result                                |
| ------------------------------------------------ | ---------------------------------------------- |
| Sign in as a teacher                             | Live session with a QR code, roster filling in |
| Sign in as `kabir.nair@college.edu`              | The live lecture shows up for marking          |
| Mark the same lecture again                      | "You've already marked this lecture"           |
| Sign in as a BTech student and open the BCA link | Blocked — the session is not for your class    |
| Sign in as `rohan.mehta@college.edu`             | 7 past lectures on the history page            |
| Close the session as the teacher                 | The student link stops working                 |
