# Lunar Cafe

End-to-end cafe platform for **Lunar Cafe** (Jubilee Hills, Hyderabad): public website, QR table ordering with group codes, staff roles, kitchen board, billing, loyalty, reservations, and owner stats.

## Quick start

```bash
cd C:\Users\admin\lunar-cafe
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo logins

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@lunar.cafe | owner123 |
| Reception | reception@lunar.cafe | reception123 |
| Waiter | waiter1@lunar.cafe | waiter123 |
| Kitchen | kitchen@lunar.cafe | kitchen123 |

## Try ordering

1. Open `/t/lunar-I1` on phone A → become host (note group code)
2. Open `/t/lunar-I1` on phone B → enter group code
3. Add items → Place order
4. Staff → Approvals → approve → Kitchen board
5. Reception → Bills → pay / print thermal layout

## Key routes

- `/` public home
- `/menu` menu without prices
- `/reserve` `/loyalty` `/feedback` `/contact`
- `/t/[tableId]` QR join
- `/order/[sessionId]` live ordering
- `/staff` staff console
- `/staff/bill/[sessionId]` digital + thermal print bill

See `ARCHITECTURE.md` for the frozen blueprint.
