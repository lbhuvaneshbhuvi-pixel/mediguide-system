# MediGuide Dashboard - Features Guide

## Overview
The user dashboard provides a comprehensive interface for managing profile information, medical queries, theme preferences, and feedback. All data is securely stored in MySQL with Firebase authentication.

---

## ✨ Dashboard Features

### 1. **👤 Profile Management**
- **Edit Profile Information**
  - Update First Name
  - Update Last Name
  - Changes saved directly to MySQL database
- **Persistent Storage**: Profile data is automatically saved and restored on page reload
- **Real-time Feedback**: Toast notifications confirm save operations

**UI Elements:**
- Two input fields (side-by-side on desktop, stacked on mobile)
- Blue-themed card with descriptive header
- "💾 Save Profile" button with loading state

---

### 2. **🎨 Theme Customization**
- **Three Theme Options:**
  - ☀️ **Light Mode**: Traditional light background
  - 🌙 **Dark Mode**: Comfortable dark theme for low-light usage
  - 💻 **System Mode**: Follows OS system preferences
  
- **Instant Application**: Theme changes apply immediately to the entire app
- **Persistent Preference**: Selected theme is saved to your profile
- **Visual Feedback**: Active theme button highlighted

**UI Elements:**
- Three responsive buttons
- Purple-themed card
- Real-time DOM updates to `document.documentElement` class

---

### 3. **💬 Feedback & Support**
- **Submit Feedback**
  - Large textarea for detailed feedback
  - Support for longer text messages
- **Organized Storage**: Feedback stored with timestamp
- **Error Handling**: Validation prevents empty submissions

**UI Elements:**
- Large (5 rows) textarea input
- Green-themed card
- "📤 Send Feedback" button with loading state
- Toast notifications for success/error

---

### 4. **🔍 Save Symptom Searches**
- **Record Medical Queries**
  - Describe your symptoms in detail
  - Store AI-recommended medicines/treatments
- **Optional AI Result**: Include doctor recommendations or AI analysis
- **Full Search History**: All searches saved for future reference

**Use Cases:**
- Track recurring symptoms over time
- Compare recommendations from multiple queries
- Maintain medical records for doctor consultations
- Build personal health history

**UI Elements:**
- Two input fields (Symptoms + AI Recommendation)
- Orange-themed card
- "📝 Save Search" button with loading state

---

### 5. **📋 Search History Viewer**
- **View Past Searches**
  - Display all previously saved symptom searches
  - Show associated AI recommendations
  - Organized chronologically (newest first)
  
- **Search Details**
  - Query text displayed clearly
  - AI recommendation (if available) shown below query
  - Responsive card layout

- **History Management**
  - View up to 50 most recent searches
  - "🗑️ Clear History" button to reset local view
  - Server records persist (can be retrieved later)

**UI Elements:**
- Individual cards for each search
- Indigo-themed header
- Gray background for search items
- Clear button (disabled when history is empty)

---

## 🎨 Design & Responsiveness

### Layout
- **Desktop**: Optimized grid layout with proper spacing
- **Mobile**: Stack-based responsive design
- **Max Width**: Content container limited to 4xl for better readability

### Color Scheme
- Profile: **Blue** (#2563eb)
- Theme: **Purple** (#a855f7)
- Feedback: **Green** (#16a34a)
- Searches: **Orange** (#ea580c)
- History: **Indigo** (#4f46e5)

### Accessibility
- Clear labels for all inputs
- Descriptive button text with emojis
- Proper contrast ratios in light and dark modes
- Loading states prevent duplicate submissions
- Toast notifications for all user actions

---

## 🔐 Security Features

### Authentication
- All API calls require Firebase ID token
- Server-side token verification (no client-side spoofing)
- User ID derived from token (enforced server-side)

### Data Protection
- MySQL encryption for stored credentials
- HTTPS recommended for production
- No sensitive data in localStorage
- Automatic token refresh on user action

### Privacy
- User data only accessible by authenticated user
- Search history private to user
- Feedback associated with user ID
- Profile modifications audit-ready

---

## 📱 Usage Instructions

### Getting Started
1. Sign up or log in with your credentials
2. Navigate to `/dashboard`
3. Fill in your profile information
4. Select your preferred theme

### Profile Management
1. Edit First Name and Last Name
2. Click "💾 Save Profile"
3. Wait for confirmation toast
4. Profile persists across sessions

### Theme Selection
1. Click your preferred theme button
2. Theme applies instantly
3. Choice saved automatically
4. Restored on next visit

### Adding Feedback
1. Type your feedback in the textarea
2. Click "📤 Send Feedback"
3. Feedback recorded with timestamp
4. Textarea clears on success

### Saving Symptom Searches
1. Describe your symptoms in first field
2. (Optional) Add AI recommendation in second field
3. Click "📝 Save Search"
4. Search appears in history immediately

### Viewing History
1. Scroll to "📋 Search History" section
2. View all saved searches
3. Click "🗑️ Clear History" to reset local view (server keeps records)

---

## 📊 Database Schema

### User Table
```
id: String (Firebase UID, Primary Key)
email: String (optional)
firstName: String (optional)
lastName: String (optional)
theme: String (system|light|dark)
createdAt: DateTime
updatedAt: DateTime
```

### Feedback Table
```
id: Int (Auto-increment, Primary Key)
userId: String (Foreign Key → User.id)
text: Text (Feedback content)
time: DateTime (Auto-generated)
```

### SearchHistory Table
```
id: Int (Auto-increment, Primary Key)
userId: String (Foreign Key → User.id)
query: Text (Symptom query)
result: Text (Optional AI recommendation)
time: DateTime (Auto-generated)
```

---

## 🚀 Performance Optimizations

- **Lazy Loading**: Dashboard data loads on user authentication
- **Error Handling**: Graceful fallbacks for API failures
- **Loading States**: UI responds immediately to user actions
- **Caching**: Profile data cached in React state
- **Responsive**: Optimized for mobile, tablet, desktop

---

## 🐛 Troubleshooting

### Dashboard Not Loading
- Ensure you're logged in (Firebase authentication)
- Check browser console for API errors
- Verify DATABASE_URL is set in `.env`

### Theme Not Persisting
- Ensure "Save Profile" is clicked after changing theme
- Check browser console for errors
- Verify Firebase token is valid

### Search Not Saving
- Fill in at least the Symptoms field (required)
- Check network tab for failed requests
- Verify MySQL connection is active

### API 401 Errors
- Firebase ID token may have expired
- Refresh page to get new token
- Check Firebase Admin SDK credentials

---

## 📞 Support

For issues or features requests:
1. Check the troubleshooting section
2. Review browser console logs
3. Verify all environment variables are set
4. Contact support with error details

---

**Last Updated**: November 12, 2025  
**Status**: ✅ Production Ready
