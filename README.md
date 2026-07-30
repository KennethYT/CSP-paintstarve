# 選課搶課系統

大學選課／搶課系統。學生在開放時間瞬間搶有限名額、額滿自動排候補；教師開課、管理名單、看儀表板。

以 **Next.js 16（App Router）+ React 19 + TypeScript + Prisma + PostgreSQL** 打造，登入使用 **better-auth**，並支援用 Discord 伺服器身份組自動辨識學生／教師身分。

## 功能

**學生**
- 瀏覽課程，可依名稱／教師搜尋、依分類篩選
- 搶課；額滿時自動加入候補並顯示排序
- 我的課表：週課表格線 + 已選清單，可退選／取消候補
- 名額變動每 4 秒自動更新，開搶倒數即時計時

**教師**
- 建立課程（分類、時段、地點、名額、開放時間）
- 查看每門課的選課名單與候補名單
- 儀表板：總課程數、選課人次、候補人數、平均額滿率、熱門課程排行

**登入**
- Email／密碼註冊登入，註冊時選擇學生或教師身分
- Discord OAuth：由機器人檢查使用者在指定伺服器的身份組，自動指派角色

## 開始開發

需要 Node.js 20+、pnpm，以及一個 PostgreSQL 資料庫。

```bash
pnpm install
cp .env.example .env      # 填入 DATABASE_URL 與 BETTER_AUTH_SECRET
pnpm db:push              # 建立資料表
pnpm db:seed              # 匯入 7 門示範課程與選課紀錄
pnpm dev
```

打開 http://localhost:3000 ，從 `/register` 註冊一個帳號即可開始。

> `pnpm db:seed` 建立的示範帳號（`teacher1@example.edu`、`student1@example.edu` …）**沒有密碼**，
> 它們只是用來讓課程有真實的選課人數與候補名單，無法登入。請自行註冊可登入的帳號。

### 指令

| 指令 | 說明 |
|---|---|
| `pnpm dev` | 開發伺服器 |
| `pnpm build` / `pnpm start` | 正式版建置／啟動 |
| `pnpm lint` | ESLint |
| `pnpm db:push` | 把 schema 同步到資料庫 |
| `pnpm db:seed` | 重建示範課程資料（會清空既有課程與選課） |
| `pnpm db:studio` | Prisma Studio |

### 環境變數

見 `.env.example`。`DATABASE_URL` 與 `BETTER_AUTH_SECRET` 是必填；Discord 相關變數不填的話，
Discord 登入按鈕會失效，但 Email／密碼登入不受影響。

## 架構

```
app/
  page.tsx                      依登入身分導向對應入口
  login/  register/             認證頁（共用 components/auth-hero.tsx 的版面）
  discord/complete/             Discord OAuth 回呼，伺服器端解析身份組後導向
  student/                      學生區（layout 做角色把關）
  teacher/                      教師區（layout 做角色把關）
  api/
    auth/[...all]/              better-auth
    register/                   註冊，並由伺服器指派 role
    courses/                    課程列表／建立
    courses/[courseId]/enroll/  搶課（POST）與退選（DELETE）
    courses/[courseId]/roster/  選課名單（僅授課教師）
lib/
  auth.ts  session.ts           認證設定與伺服器端 session helper
  course-service.ts             課程／選課的核心邏輯，含併發控制
  course-utils.ts               狀態判斷與格式化
  course-constants.ts           分類、星期、節次
components/
  classroom-store.tsx           前端狀態：首屏由伺服器帶入，之後輪詢更新
  role-shell.tsx                server component，角色把關 + 首屏資料
proxy.ts                        edge 層的 cookie 檢查（非授權依據）
```

### 搶課的併發正確性

開搶瞬間會有大量請求同時打同一堂課，必須保證**不超賣**。作法是在交易一開始對該課程取得
Postgres 的 transaction-level advisory lock：

```ts
await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${courseId}, 0))`;
```

取得鎖之後才去數目前已選人數、決定要給正取還是候補，因此讀到的數字不可能在寫入前被別人改掉。
鎖隨交易結束自動釋放，不同課程之間互不影響。

> 一開始是用 `Serializable` 隔離等級加重試，但那個做法在高競爭下會讓 Postgres 中止大量交易
> （P2034 寫入衝突）：實測 20 人搶 5 個名額時，重試 5 次仍有 4 個請求失敗。
> advisory lock 是排隊而非互相中止，50 人搶 3 個名額也全數正確回應。

資料表上另有 `@@unique([courseId, userId])`，作為重複選課的最後防線。

退選在同一把鎖底下完成：刪除該筆選課後，若釋出的是正取名額，候補第一位會自動遞補，
其餘候補的排序號碼重新排成連續的 1、2、3……

### 權限

三層，由外到內：

1. `proxy.ts` — edge 層只看 session cookie 在不在，是效能優化，**不是授權依據**
2. `app/student/layout.tsx`、`app/teacher/layout.tsx` — server component 用
   `requireRole()` 做權威把關，關掉 JS 也繞不過
3. 每個 API route 各自驗證 session 與角色

使用者的 `role` 在 better-auth 設為 `input: false`，只有註冊 API 與 Discord 身份組解析能寫入，
使用者無法自行把自己改成教師。

選課名單不會隨課程列表送到瀏覽器，只有授課教師能透過 `/api/courses/[courseId]/roster` 取得。

## 部署

任何支援 Next.js 與 PostgreSQL 的平台都可以。設定好 `DATABASE_URL`、`BETTER_AUTH_SECRET`、
`BETTER_AUTH_URL`（要是正式網址）後執行 `pnpm db:push` 建表即可。

使用 Discord 登入的話，記得把 `<你的網址>/api/auth/callback/discord` 加進 Discord 應用程式的
OAuth2 Redirect URI。
