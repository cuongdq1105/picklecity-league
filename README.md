# PickleCity League Module 01

V1.0 Alpha: Frontend + Cloudflare Pages Functions.

## Deploy
1. Upload project này lên GitHub repository `picklecity-league`.
2. Cloudflare Pages kết nối GitHub repository.
3. Add D1 binding cho Pages project:
   - Variable name: `DB`
   - Database: `picklecity-db`
4. Build command: `npm run build`
5. Build output directory: `dist`

## Database
Yêu cầu đã có 4 bảng: members, event_types, tournaments, registrations.
Update deploy
