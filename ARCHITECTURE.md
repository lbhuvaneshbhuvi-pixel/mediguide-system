# 🏗️ MediGuide Dashboard - Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          USER BROWSER                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │           Dashboard UI (React Component)                   │ │
│  │  ┌──────────┬──────────┬──────────┬──────────┬──────────┐ │ │
│  │  │ Profile  │  Theme   │ Feedback │ Searches │ History  │ │ │
│  │  │  (Blue)  │(Purple)  │ (Green)  │(Orange)  │(Indigo)  │ │ │
│  │  └──────────┴──────────┴──────────┴──────────┴──────────┘ │ │
│  │                                                            │ │
│  │  🔐 Firebase Authentication (Client-side)                 │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────┐
        │  HTTPS (with Firebase ID Token)       │
        │  Authorization: Bearer <Token>        │
        └───────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                     NEXT.JS SERVER                               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  API Routes (Token Verification)                           │ │
│  │  ┌──────────────┬────────────────┬──────────────────────┐ │ │
│  │  │ /api/users   │ /api/feedback  │ /api/search-history │ │ │
│  │  │              │                │                      │ │ │
│  │  │ - Verify token                                      │ │ │
│  │  │ - Extract uid (server-side)                         │ │ │
│  │  │ - Validate input                                    │ │ │
│  │  │ - Call Prisma/Database                              │ │ │
│  │  │ - Return JSON response                              │ │ │
│  │  └──────────────┴────────────────┴──────────────────────┘ │ │
│  │                                                            │ │
│  │  🔐 Firebase Admin SDK (Token Verification)               │ │
│  │     ↓                                                      │ │
│  │  Prisma ORM (Database Access)                             │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────┐
        │  SQL Queries (Parameterized)          │
        │  No SQL Injection Risk                │
        └───────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                      MYSQL DATABASE                              │
│  ┌──────────────┬──────────────┬───────────────────────────┐   │
│  │    user      │   feedback   │    searchhistory         │   │
│  │              │              │                           │   │
│  │ id (PK)      │ id (PK)      │ id (PK)                 │   │
│  │ email        │ userId (FK)  │ userId (FK)             │   │
│  │ firstName    │ text         │ query                   │   │
│  │ lastName     │ time         │ result                  │   │
│  │ theme        │              │ time                    │   │
│  │ createdAt    │              │                         │   │
│  │ updatedAt    │              │                         │   │
│  └──────────────┴──────────────┴───────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### Sign-up to Dashboard Flow

```
User Signs Up
    ↓
1. Enter: firstName, lastName, email, password
    ↓
2. Firebase Auth: createUserWithEmailAndPassword
    ↓
3. Auth Success → Get Firebase ID Token
    ↓
4. POST /api/users with {email, firstName, lastName, token}
    ↓
5. Server:
   - Verify token → Extract uid
   - Upsert user to MySQL
    ↓
6. Database:
   - Check if user exists
   - Update if exists, Create if not
    ↓
7. Response: User object (id, email, firstName, lastName, theme)
    ↓
8. Redirect to Dashboard
    ↓
Dashboard Loads
    ↓
9. GET /api/users with token
    ↓
10. GET /api/search-history with token
    ↓
11. Display Profile + History
```

### Save Operation Flow

```
User Enters Data
    ↓
1. Click "Save" button
    ↓
2. Disable button (loading = true)
    ↓
3. Get Firebase ID Token
    ↓
4. POST to /api/* with {data, token}
    ↓
5. Server:
   - Verify token
   - Extract uid
   - Validate data
   - Save to MySQL
    ↓
6. Database:
   - INSERT or UPDATE
    ↓
7. Return success
    ↓
8. Client:
   - Enable button (loading = false)
   - Show toast notification
   - Update UI
```

---

## Component Structure

```
DashboardPage (src/app/dashboard/page.tsx)
│
├─ useUser() → Firebase authentication
├─ useToast() → Toast notifications
│
├─ State:
│  ├─ firstName, lastName
│  ├─ feedbackText
│  ├─ searchHistory
│  ├─ theme
│  ├─ loading
│  └─ symptom/AI fields
│
├─ useEffect:
│  ├─ Load user profile from API
│  └─ Load search history from API
│
├─ Functions:
│  ├─ saveProfile()
│  ├─ sendFeedback()
│  ├─ saveSearch()
│  ├─ clearHistory()
│  └─ applyTheme()
│
└─ UI Components:
   ├─ Card (Section containers)
   ├─ Input (Text fields)
   ├─ Button (Actions)
   ├─ Textarea (Feedback)
   └─ Toast (Notifications)
```

---

## API Route Structure

### Authentication Layer
```
Request
    ↓
Extract Authorization header
    ↓
Get Bearer token
    ↓
Verify with Firebase Admin SDK
    ↓
If valid → uid = decoded.uid
If invalid → Return 401 Unauthorized
```

### Processing Layer
```
Authenticated Request
    ↓
Parse request body/query
    ↓
Validate input data
    ↓
Process business logic
    ↓
Execute Prisma query
```

### Response Layer
```
Success
    ↓
Return 200 with data
    ↓
JSON response to client
    ↓
Client updates UI

Error
    ↓
Return 4xx/5xx
    ↓
Error message to client
    ↓
Client shows error toast
```

---

## Database Relationships

```
User (1 → Many)
│
├─ Feedback
│  ├─ id
│  ├─ userId (FK)
│  ├─ text
│  └─ time
│
└─ SearchHistory
   ├─ id
   ├─ userId (FK)
   ├─ query
   ├─ result
   └─ time

Relationships:
- User.id = Feedback.userId (many-to-one)
- User.id = SearchHistory.userId (many-to-one)
```

---

## Security Layers

```
Layer 1: Client Authentication
    ↓ Firebase Auth
    ↓ Browser stores JWT token

Layer 2: HTTPS
    ↓ Secure transport
    ↓ Token never exposed

Layer 3: Authorization Header
    ↓ Bearer token in header
    ↓ NOT in body/query

Layer 4: Server-side Verification
    ↓ Firebase Admin SDK
    ↓ Verify token signature
    ↓ Extract uid (server-only)

Layer 5: Input Validation
    ↓ Validate request data
    ↓ Prevent injection attacks

Layer 6: Parameterized Queries
    ↓ Prisma ORM
    ↓ No SQL injection possible
```

---

## State Management

```
DashboardPage Component State

User Profile
├─ firstName: string
├─ lastName: string
├─ theme: "system" | "light" | "dark"
└─ email: string (read-only)

Feedback
├─ feedbackText: string
└─ loading: boolean

Search
├─ symptomQuery: string
├─ aiResult: string
├─ searchHistory: Array
└─ loading: boolean

UI
└─ loading: boolean (for all operations)

Flow:
User Input
    ↓
Update State
    ↓
Call API
    ↓
Set loading = true
    ↓
Wait for response
    ↓
Update state with response
    ↓
Set loading = false
    ↓
Show notification
    ↓
Refresh related data (optional)
```

---

## Error Handling Flow

```
Error Occurs
    ↓
Try-Catch Block
    ↓
Log to console
    ↓
Show Toast Notification
│
├─ Success: Green toast
├─ Error: Red toast with message
└─ Info: Blue toast

User sees:
✓ Success: "Profile saved"
✗ Error: "Error saving profile: [details]"
ℹ Info: "Feedback sent"
```

---

## Performance Optimization

```
Initial Load
├─ Lazy load profile data
├─ Lazy load search history
└─ Cache in React state

User Action
├─ Disable button immediately
├─ Show loading state
├─ Make API call
├─ Update state on response
└─ Enable button

Future Loads
├─ Profile cached in state
├─ Restore from cache
├─ No redundant API calls
└─ Smooth experience
```

---

## Browser Compatibility

```
✅ Chrome/Chromium
✅ Firefox
✅ Safari
✅ Edge
✅ Mobile browsers

Technologies:
- React 18.3.1 (widely supported)
- Next.js 15.5.6 (latest)
- Tailwind CSS (CSS3)
- TypeScript (compiles to JS)
```

---

## Deployment Architecture

```
Production Setup:
    ↓
Next.js Server (Node.js)
    ├─ API Routes
    ├─ Dashboard page
    └─ Static assets
    ↓
MySQL Database
    ├─ User profiles
    ├─ Feedback
    └─ Search history
    ↓
Firebase Auth
    ├─ Sign up/login
    └─ Token generation
    ↓
CDN (optional)
    └─ Static assets caching
```

---

## Technology Stack Layers

```
┌─────────────────────────────────┐
│   UI Layer                      │
│   React + Tailwind CSS          │
├─────────────────────────────────┤
│   Framework Layer               │
│   Next.js + TypeScript          │
├─────────────────────────────────┤
│   API Layer                     │
│   API Routes + Express middleware
├─────────────────────────────────┤
│   Auth Layer                    │
│   Firebase Admin SDK            │
├─────────────────────────────────┤
│   ORM Layer                     │
│   Prisma                        │
├─────────────────────────────────┤
│   Database Layer                │
│   MySQL                         │
└─────────────────────────────────┘
```

---

## Summary

The MediGuide Dashboard uses a modern, secure architecture:

1. **Frontend**: React component with responsive UI
2. **Auth**: Firebase for authentication + Admin SDK for verification
3. **API**: Secured Next.js API routes with token verification
4. **Database**: MySQL with Prisma ORM for type-safe queries
5. **Security**: Multiple layers from client to database
6. **Performance**: Optimized state management and API calls

All data flows are secure, validated, and properly typed. The system is ready for production deployment.

---

**Last Updated**: November 12, 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅
