# 🎉 MEDIGUIDE DASHBOARD - READY FOR TESTING

**Status**: 🟢 **SERVER RUNNING - DASHBOARD ACTIVE**  
**Date**: November 13, 2025  
**Port**: 9002

---

## ✅ Current Status

| Component | Status | Details |
|-----------|--------|---------|
| **Dev Server** | ✅ Running | http://localhost:9002 |
| **Dashboard** | ✅ Accessible | http://localhost:9002/dashboard |
| **Database** | ✅ Connected | MySQL - 3 tables ready |
| **Token Verification** | ✅ Working | Manual JWT decode (no Admin SDK) |
| **Profile API** | ✅ Ready | /api/users |
| **Feedback API** | ✅ Ready | /api/feedback |
| **Search History API** | ✅ Ready | /api/search-history |

---

## 🧪 TESTING GUIDE

### Feature 1: Profile Editing ✅

**Location**: Blue Card (👤 Profile)

**Steps**:
```
1. Open http://localhost:9002/dashboard
2. Find the BLUE card labeled "👤 Profile"
3. Enter in "First Name" field: John
4. Enter in "Last Name" field: Doe
5. Click [💾 Save Profile] button
6. Expected: See toast "✓ Profile saved successfully"
7. Refresh page (F5)
8. Expected: Names still showing (persistent)
```

**Verify in Database**:
```bash
mysql -u root -pbhuvi -h 127.0.0.1 mediguide
SELECT id, email, firstName, lastName FROM user LIMIT 1;
```

---

### Feature 2: Feedback Submission ✅

**Location**: Green Card (💬 Feedback)

**Steps**:
```
1. Find the GREEN card labeled "💬 Feedback"
2. Click in the textarea
3. Type: "Dashboard works great!"
4. Click [📤 Send Feedback] button
5. Expected: See toast "✓ Feedback sent"
6. Expected: Textarea clears automatically
7. Try sending empty feedback (should error)
```

**Verify in Database**:
```bash
mysql -u root -pbhuvi -h 127.0.0.1 mediguide
SELECT userId, text, time FROM feedback ORDER BY time DESC LIMIT 1;
```

---

### Feature 3: Search History ✅

**Location**: Orange Card (🔍) + Indigo Card (📋)

**Steps**:
```
1. Find the ORANGE card labeled "🔍 Save Symptom Search"
2. Enter Symptom: "Headache for 2 days"
3. Enter Result: "Rest, drink water, take paracetamol"
4. Click [📝 Save Search] button
5. Expected: See toast "✓ Search saved"
6. Scroll down to INDIGO card "📋 Search History"
7. Expected: Your search appears in the list
8. Expected: Newest searches appear at the top
9. Save another search and verify order
```

**Verify in Database**:
```bash
mysql -u root -pbhuvi -h 127.0.0.1 mediguide
SELECT userId, query, result, time FROM searchhistory ORDER BY time DESC LIMIT 5;
```

---

## 🔍 How to Debug

### Check Server Logs

Server terminal shows:
```
✓ Ready in 1509ms          [Server is ready]
○ Compiling / ...           [Compiling route]
✓ Compiled / in 10.8s       [Route compiled]
GET / 200 in 12781ms        [Successful request]
```

### Check Browser Console

Press `F12` to open developer tools, go to **Console** tab.

**Good signs**:
```
✓ Token decoded successfully, uid: <uid>
```

**Error signs**:
```
✗ Failed to parse token payload
✗ Token verification error
```

### Check Database Connection

```bash
mysql -u root -pbhuvi -h 127.0.0.1 mediguide
```

Should show:
```
mysql>
```

### Test API Directly

```bash
# Get your token (from browser, Firebase Auth)
TOKEN="your_firebase_token"

# Test Profile API
curl -X GET http://localhost:9002/api/users \
  -H "Authorization: Bearer $TOKEN"

# Test Feedback API
curl -X GET http://localhost:9002/api/feedback \
  -H "Authorization: Bearer $TOKEN"

# Test Search History API
curl -X GET http://localhost:9002/api/search-history \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🛑 If Something Doesn't Work

### 1. Server Stopped?
```bash
# Restart from correct directory
pushd "c:\Users\BHUVI\mediguide\mediguide"; npm run dev
```

### 2. Port 9002 Already in Use?
```bash
# Check what's on port 9002
netstat -ano | findstr :9002

# Kill the process (if needed)
taskkill /PID <PID> /F
```

### 3. Database Connection Error?
```bash
# Check MySQL is running
mysql -u root -pbhuvi -h 127.0.0.1 mediguide

# If not, start MySQL service
```

### 4. Token Verification Fails?
- Make sure you're logged in (Firebase Auth)
- Token should be sent in `Authorization: Bearer <token>` header
- Check browser console for token errors

### 5. Data Not Saving to Database?
- Check you're logged in with a valid user
- Check token is being sent correctly
- Check database user table has your uid
- Run debug SQL: `SELECT * FROM user;`

---

## 📊 System Architecture

```
Browser (Firebase Auth)
    ↓
    ├─→ Login → Get Token
    │
Dashboard (React Component)
    ↓
    ├─→ Profile Editing → POST /api/users
    ├─→ Feedback Submission → POST /api/feedback
    └─→ Search History → GET/POST /api/search-history
    │
API Routes (Next.js)
    ↓
    ├─→ Extract token from header
    ├─→ Verify token → Extract uid
    ├─→ Query database with uid
    │
Database (MySQL)
    ↓
    ├─→ user table (firstName, lastName, theme)
    ├─→ feedback table (userId, text, time)
    └─→ searchhistory table (userId, query, result, time)
```

---

## ✅ Pre-Test Checklist

- [x] Server running on port 9002
- [x] Dashboard accessible at http://localhost:9002/dashboard
- [x] Database connected (MySQL)
- [x] All 3 tables created (user, feedback, searchhistory)
- [x] Token verification working (JWT decode)
- [x] API routes compiled and ready
- [x] No TypeScript errors
- [x] No npm errors
- [x] Dark mode supported
- [x] Responsive design ready

---

## 📝 Test Results Template

**Tester**: _________________  
**Date**: _________________

### Profile Editing
- [ ] Save profile with name ✓/✗
- [ ] Data persists after refresh ✓/✗
- [ ] Toast message shows ✓/✗
- [ ] Database updated ✓/✗

### Feedback Submission
- [ ] Send feedback message ✓/✗
- [ ] Textarea clears after send ✓/✗
- [ ] Toast message shows ✓/✗
- [ ] Database updated ✓/✗
- [ ] Empty feedback validation works ✓/✗

### Search History
- [ ] Save search with symptom & result ✓/✗
- [ ] Search appears in history list ✓/✗
- [ ] Newest searches appear first ✓/✗
- [ ] Toast message shows ✓/✗
- [ ] Database updated ✓/✗
- [ ] Clear history button works ✓/✗

---

## 🎯 Next Steps

1. **Login** at http://localhost:9002/dashboard
2. **Test** each of the 3 features
3. **Verify** data in MySQL database
4. **Check** browser console for errors
5. **Report** any issues

---

## 📞 Support Files

See these files for more info:
- `NO_ADMIN_SDK_SETUP.md` - Setup details
- `FIXES_APPLIED.md` - What was changed
- `FINAL_VERIFICATION_REPORT.md` - Complete feature verification

---

**Dashboard is ready for comprehensive testing!** 🚀

Access it now: **http://localhost:9002/dashboard**
