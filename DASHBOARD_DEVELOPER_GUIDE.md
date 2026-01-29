# MediGuide Dashboard - Developer Quick Reference

## 🗂️ File Structure

```
src/
├── app/
│   ├── dashboard/
│   │   └── page.tsx          ← Main dashboard component
│   └── api/
│       ├── users/
│       │   └── route.ts      ← User profile API
│       ├── feedback/
│       │   └── route.ts      ← Feedback API
│       └── search-history/
│           └── route.ts      ← Search history API
├── lib/
│   ├── db.ts                 ← Prisma client singleton
│   └── firebaseAdmin.ts      ← Firebase token verification
└── components/
    └── ui/
        └── card.tsx          ← Card component used in dashboard
```

---

## 🔄 Data Flow

### User Sign-up Flow
```
1. User submits signup form
   ↓
2. Firebase auth creates account (client-side)
   ↓
3. Get Firebase ID token
   ↓
4. POST to /api/users with token
   ↓
5. Server verifies token, extracts uid
   ↓
6. Upsert user to MySQL
   ↓
7. Redirect to dashboard
```

### Dashboard Data Load Flow
```
1. Dashboard page loads
   ↓
2. useUser hook checks authentication
   ↓
3. Get Firebase ID token
   ↓
4. GET /api/users with token
   ↓
5. Server verifies token, returns user profile
   ↓
6. GET /api/search-history with token
   ↓
7. Display profile + history in UI
```

### Save Operation Flow
```
1. User enters data + clicks "Save"
   ↓
2. Disable button (loading = true)
   ↓
3. Get Firebase ID token
   ↓
4. POST to /api/* with data + token
   ↓
5. Server verifies token, extracts uid
   ↓
6. Validate and save to MySQL
   ↓
7. Return success/error
   ↓
8. Enable button, show toast notification
```

---

## 🔐 API Routes Reference

### GET /api/users
**Purpose**: Fetch authenticated user's profile
```
Headers:
  Authorization: Bearer <Firebase ID Token>

Response:
  {
    id: "firebase-uid",
    email: "user@example.com",
    firstName: "John",
    lastName: "Doe",
    theme: "dark",
    createdAt: "2025-11-12T...",
    updatedAt: "2025-11-12T..."
  }

Error Responses:
  401: Unauthorized (invalid/missing token)
```

### POST /api/users
**Purpose**: Create or update user profile
```
Headers:
  Authorization: Bearer <Firebase ID Token>
  Content-Type: application/json

Body:
  {
    email?: "user@example.com",
    firstName?: "John",
    lastName?: "Doe",
    theme?: "light|dark|system"
  }

Response: Updated user object

Error Responses:
  401: Unauthorized
  400: Bad request
```

### POST /api/feedback
**Purpose**: Submit user feedback
```
Headers:
  Authorization: Bearer <Firebase ID Token>
  Content-Type: application/json

Body:
  {
    text: "User feedback text..."
  }

Response:
  {
    id: 1,
    userId: "firebase-uid",
    text: "...",
    time: "2025-11-12T..."
  }

Error Responses:
  401: Unauthorized
  400: Missing feedback text
```

### GET /api/feedback
**Purpose**: Retrieve user's feedback history
```
Headers:
  Authorization: Bearer <Firebase ID Token>

Response:
  [
    {
      id: 1,
      userId: "...",
      text: "...",
      time: "..."
    },
    ...
  ]

Error Responses:
  401: Unauthorized
```

### POST /api/search-history
**Purpose**: Save a symptom search
```
Headers:
  Authorization: Bearer <Firebase ID Token>
  Content-Type: application/json

Body:
  {
    query: "Headache and fever...",
    result?: "Consult doctor and rest..."
  }

Response:
  {
    id: 1,
    userId: "firebase-uid",
    query: "...",
    result: "...",
    time: "..."
  }

Error Responses:
  401: Unauthorized
  400: Missing query
```

### GET /api/search-history
**Purpose**: Retrieve user's search history
```
Headers:
  Authorization: Bearer <Firebase ID Token>

Response:
  [
    {
      id: 1,
      userId: "...",
      query: "...",
      result: "...",
      time: "..."
    },
    ...
  ]

Error Responses:
  401: Unauthorized
```

---

## 🔧 Key Functions in Dashboard

### fetchProfile(uid, idToken)
```tsx
// Fetch user profile from API
const profile = await fetchProfile(user.uid, idToken);
// Returns: { firstName, lastName, theme, email } or null
```

### saveProfileApi(payload)
```tsx
// Save profile with embedded token
await saveProfileApi({
  id: user.uid,
  email: user.email,
  firstName: "John",
  lastName: "Doe",
  theme: "dark",
  __token: idToken  // Embedded for API header
});
```

### applyTheme(theme)
```tsx
// Apply theme to DOM and save to profile
applyTheme("dark");
// Updates document.documentElement.classList
// Persists to MySQL via saveProfileApi
```

### fetchSearchHistory(uid, idToken)
```tsx
// Get all user searches
const history = await fetchSearchHistory(user.uid, idToken);
// Returns: Array of { query, result, time }
```

### saveSearchApi(payload)
```tsx
// Save a new symptom search
await saveSearchApi({
  userId: user.uid,
  query: "Headache for 2 days",
  result: "Take paracetamol",
  __token: idToken
});
```

---

## 📊 Database Operations with Prisma

### Create/Update User
```tsx
await prisma.user.upsert({
  where: { id: uid },
  create: {
    id: uid,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    theme: data.theme
  },
  update: {
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    theme: data.theme,
    updatedAt: new Date()
  }
});
```

### Find User
```tsx
const user = await prisma.user.findUnique({
  where: { id: uid }
});
```

### Create Feedback
```tsx
await prisma.feedback.create({
  data: {
    userId: uid,
    text: feedbackText
  }
});
```

### List User's Feedback
```tsx
const feedback = await prisma.feedback.findMany({
  where: { userId: uid },
  orderBy: { time: 'desc' },
  take: 50
});
```

### Create Search History Entry
```tsx
await prisma.searchHistory.create({
  data: {
    userId: uid,
    query: symptomQuery,
    result: aiResult
  }
});
```

### List Search History
```tsx
const history = await prisma.searchHistory.findMany({
  where: { userId: uid },
  orderBy: { time: 'desc' },
  take: 50
});
```

---

## 🛠️ Environment Variables

Required in `.env`:
```
GEMINI_API_KEY=your-api-key
DATABASE_URL=mysql://root:bhuvi@127.0.0.1:3306/mediguide
```

Optional:
```
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

---

## 🧪 Testing the Dashboard

### Manual Test Steps
1. Start dev server: `npm run dev`
2. Visit http://localhost:9002
3. Click "Sign Up" (or "Auth" button)
4. Fill signup form
5. Get redirected to dashboard
6. Test each feature:
   - Edit profile and save
   - Change theme
   - Submit feedback
   - Save a search
   - View history

### Verify in MySQL
```powershell
mysql -u root -pbhuvi -h 127.0.0.1 mediguide

# Check user created
SELECT * FROM user;

# Check feedback
SELECT * FROM feedback WHERE userId = 'your-firebase-uid';

# Check searches
SELECT * FROM searchhistory WHERE userId = 'your-firebase-uid';
```

---

## 🐛 Common Issues & Solutions

### Issue: 401 Unauthorized on API calls
**Cause**: Firebase token verification failing
**Solution**: 
- Ensure FIREBASE_SERVICE_ACCOUNT is configured OR Application Default Credentials are set
- Check Firebase Admin SDK initialization in `src/lib/firebaseAdmin.ts`

### Issue: API calls returning null
**Cause**: User doesn't exist in MySQL yet
**Solution**:
- Make sure signup completes successfully
- Check that `/api/users` POST was called after auth
- Verify user exists in MySQL: `SELECT * FROM user WHERE id = 'uid';`

### Issue: Theme not persisting
**Cause**: saveProfileApi not being called or failing silently
**Solution**:
- Check browser console for errors
- Ensure user is authenticated
- Verify POST /api/users succeeds (should return 200)

### Issue: Search history not showing
**Cause**: No searches saved yet OR API returning empty array
**Solution**:
- Add a test search through the UI
- Check MySQL: `SELECT COUNT(*) FROM searchhistory WHERE userId = 'uid';`
- Verify GET /api/search-history returns data

---

## 📚 Component Dependencies

```tsx
// Dashboard Component Dependencies
useUser()           // Firebase auth hook
useToast()          // Toast notification hook
Button              // UI component
Input               // UI component
Card                // UI component with variants
CardContent
CardDescription
CardHeader
CardTitle
```

---

## 🔌 Extension Points

### Add New Dashboard Section
1. Create new state variable: `const [data, setData] = useState(...)`
2. Add useEffect to load data if needed
3. Create async handler function
4. Create Card section with color-themed header
5. Add proper error handling and loading state
6. Test API calls in browser console

### Add New API Route
1. Create `src/app/api/[feature]/route.ts`
2. Implement GET/POST handlers
3. Call `verifyFirebaseIdToken` first
4. Use Prisma for database operations
5. Return JSON responses with proper status codes

---

## 📖 Related Documentation

- `DASHBOARD_FEATURES.md` - User-facing feature guide
- `DASHBOARD_UI_IMPROVEMENTS.md` - UI/UX improvements
- `.github/copilot-instructions.md` - AI agent guidelines
- `src/lib/firebaseAdmin.ts` - Token verification logic
- `prisma/schema.prisma` - Database schema

---

**Last Updated**: November 12, 2025  
**Version**: 1.0.0
