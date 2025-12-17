# Testing Guide for SecondShelf with Supabase

## 🧪 Phase 5: Testing & Error Handling

This guide will help you test all functionality of the SecondShelf application with Supabase integration.

## Prerequisites

1. ✅ Supabase project created and configured
2. ✅ Database migrations run successfully
3. ✅ Google OAuth configured
4. ✅ Environment variables set in `.env.local`
5. ✅ Development server running (`npm run dev`)

## Test Checklist

### 1. Basic Functionality (No Authentication Required)

#### ✅ Browse Books
- [ ] Navigate to homepage (`/`)
- [ ] Verify books are displayed (or empty state if no books)
- [ ] Check that books show: title, author, course, price, contact
- [ ] Verify books are sorted by newest first

#### ✅ Search Functionality
- [ ] Type in search bar
- [ ] Verify results filter by title, author, or course
- [ ] Clear search and verify all books show again
- [ ] Test with partial matches (e.g., "CS" should find "CS101")

### 2. Authentication Flow

#### ✅ Sign In
- [ ] Click "Sign In" button in header
- [ ] Verify redirect to Google OAuth
- [ ] Complete Google sign-in
- [ ] Verify redirect back to app
- [ ] Check that header shows user email/name
- [ ] Verify "Sign Out" button appears

#### ✅ Sign Out
- [ ] Click "Sign Out" button
- [ ] Verify user is signed out
- [ ] Check that "Sign In" button appears again
- [ ] Verify favorites are cleared

### 3. Adding Books (Requires Authentication)

#### ✅ Add Book - Success
- [ ] Navigate to `/add` page
- [ ] If not signed in, verify sign-in prompt appears
- [ ] Sign in if needed
- [ ] Fill out all required fields:
  - Title: "Test Book"
  - Author: "Test Author"
  - Course: "TEST101"
  - Price: "$50"
  - Contact: "test@example.com"
  - Your Name: "Test User"
- [ ] Click "Add Listing"
- [ ] Verify success (redirects to homepage)
- [ ] Verify new book appears in list
- [ ] Verify book shows your name as poster

#### ✅ Add Book - Validation Errors
- [ ] Try submitting with empty fields
- [ ] Verify validation errors appear
- [ ] Try submitting with only spaces
- [ ] Verify validation prevents submission

#### ✅ Add Book - Network Error
- [ ] Disconnect internet
- [ ] Try to add a book
- [ ] Verify error message appears
- [ ] Reconnect internet
- [ ] Verify you can add books again

### 4. Managing Your Books

#### ✅ Mark as Sold
- [ ] Find a book you created
- [ ] Click "Mark as Sold" button
- [ ] Verify book disappears from list
- [ ] Verify book is removed from favorites if it was favorited

#### ✅ Edit Book (if implemented)
- [ ] Find a book you created
- [ ] Verify you can see edit option
- [ ] Make changes and save
- [ ] Verify changes appear in list

#### ✅ Delete Book (if implemented)
- [ ] Find a book you created
- [ ] Delete it
- [ ] Verify it's removed from list

### 5. Favorites Functionality

#### ✅ Add to Favorites
- [ ] Sign in
- [ ] Find a book (not your own)
- [ ] Click "Save to Favorites" (☆)
- [ ] Verify button changes to "Saved" (★)
- [ ] Navigate to `/favorites` page
- [ ] Verify book appears in favorites list

#### ✅ Remove from Favorites
- [ ] On favorites page, find a favorited book
- [ ] Click "Saved" (★) button
- [ ] Verify button changes to "Save to Favorites" (☆)
- [ ] Verify book is removed from favorites page

#### ✅ Favorites Persistence
- [ ] Add a book to favorites
- [ ] Sign out
- [ ] Sign back in
- [ ] Navigate to favorites
- [ ] Verify favorites are still there

#### ✅ Favorites - Not Signed In
- [ ] Sign out
- [ ] Try to add a favorite
- [ ] Verify sign-in prompt or error message
- [ ] Navigate to `/favorites`
- [ ] Verify sign-in prompt appears

### 6. Permission Testing

#### ✅ Cannot Modify Others' Books
- [ ] Sign in as User A
- [ ] Create a book
- [ ] Sign out
- [ ] Sign in as User B (different Google account)
- [ ] Try to mark User A's book as sold
- [ ] Verify you don't see "Mark as Sold" button (or get error if you try)

#### ✅ Can Only See Own Favorites
- [ ] Sign in as User A
- [ ] Add some favorites
- [ ] Sign out
- [ ] Sign in as User B
- [ ] Navigate to favorites
- [ ] Verify only User B's favorites show (empty if none)

### 7. Error Handling

#### ✅ Network Errors
- [ ] Disconnect internet
- [ ] Try to load homepage
- [ ] Verify error message appears
- [ ] Reconnect internet
- [ ] Verify page loads successfully

#### ✅ Authentication Errors
- [ ] Let session expire (or manually invalidate)
- [ ] Try to add a book
- [ ] Verify "session expired" error message
- [ ] Sign in again
- [ ] Verify you can add books

#### ✅ Permission Errors
- [ ] Try to update someone else's book (via API if possible)
- [ ] Verify permission error message

#### ✅ Not Found Errors
- [ ] Try to access a book with invalid ID
- [ ] Verify appropriate error handling

### 8. Edge Cases

#### ✅ Empty States
- [ ] Delete all books
- [ ] Verify empty state message appears
- [ ] Verify "Add Your First Book" link works

#### ✅ Large Data Sets
- [ ] Add 20+ books
- [ ] Verify all load correctly
- [ ] Verify search still works
- [ ] Verify performance is acceptable

#### ✅ Special Characters
- [ ] Add book with special characters: `!@#$%^&*()`
- [ ] Add book with emojis: 📚 🎓
- [ ] Add book with unicode: 中文
- [ ] Verify all display correctly

#### ✅ Long Text
- [ ] Add book with very long title (100+ characters)
- [ ] Add book with very long description
- [ ] Verify UI handles it gracefully

### 9. Real-time Updates (If Implemented)

#### ✅ New Books Appear
- [ ] Open app in two browsers
- [ ] Add book in Browser A
- [ ] Verify book appears in Browser B (if real-time enabled)

### 10. Performance Testing

#### ✅ Load Time
- [ ] Measure initial page load time
- [ ] Should be < 2 seconds on good connection
- [ ] Verify loading states appear during fetch

#### ✅ Search Performance
- [ ] With 50+ books, test search
- [ ] Verify search is responsive (< 500ms)

## Common Issues & Solutions

### Issue: "Failed to fetch books"
**Solution:**
- Check Supabase project is active
- Verify `.env.local` has correct credentials
- Check browser console for detailed error
- Verify database tables exist

### Issue: "You must be signed in"
**Solution:**
- Click "Sign In" button
- Complete Google OAuth flow
- Verify redirect URL is correct in Supabase settings

### Issue: "Permission denied"
**Solution:**
- Verify RLS policies are set correctly
- Check that user_id matches book owner
- Verify user is authenticated

### Issue: Books not appearing
**Solution:**
- Check Supabase dashboard for data
- Verify RLS policies allow SELECT
- Check browser console for errors
- Try refreshing page

### Issue: Favorites not saving
**Solution:**
- Verify user is signed in
- Check favorites table exists
- Verify RLS policies allow INSERT
- Check browser console for errors

## Automated Testing (Future)

Consider adding:
- Unit tests for API functions
- Integration tests for store actions
- E2E tests with Playwright/Cypress
- API endpoint tests

## Performance Benchmarks

- **Page Load**: < 2 seconds
- **Search**: < 500ms
- **Add Book**: < 1 second
- **Toggle Favorite**: < 500ms
- **Mark as Sold**: < 1 second

## Security Checklist

- [ ] Users can only modify their own books
- [ ] Users can only see their own favorites
- [ ] RLS policies are enabled
- [ ] No sensitive data in client-side code
- [ ] Environment variables not committed
- [ ] API keys are public keys (anon key), not service role

## Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

## Final Checklist

Before considering Phase 5 complete:
- [ ] All functionality works as expected
- [ ] Error messages are user-friendly
- [ ] Loading states appear appropriately
- [ ] No console errors
- [ ] Performance is acceptable
- [ ] Security is verified
- [ ] Works across browsers

