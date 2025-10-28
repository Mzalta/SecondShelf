# SecondShelf - Product Requirements Document (PRD)

## Project Overview

**Project Name:** SecondShelf  
**Project Type:** Web Application  
**Target Users:** College students looking to buy, sell, or trade used textbooks locally  
**Main Goal:** Provide a simple, local platform for students to exchange textbooks, saving money and reducing waste.

---

## Problem Statement

College textbooks are expensive, and students often struggle to find affordable options or recoup costs after classes end. Many textbook exchange platforms are complex or require shipping, making them inconvenient for local exchanges.

---

## Solution

SecondShelf is a simple, local-focused web application that allows college students to:
- Post listings for textbooks they want to sell or trade
- Browse available textbooks from other students
- Save favorite listings for later
- Search and filter by title, author, or course

---

## MVP Features (Minimum Viable Product)

### Core Features

1. **Add Book Listing**
   - Form to input: title, author, price/trade option, course, contact information
   - Save listings to local storage for persistence
   - Display new listing dynamically on the homepage

2. **Browse Listings**
   - Display all book listings as cards
   - Show: title, author, price, course, contact info
   - Each listing has "Mark as Sold" and "Save to Favorites" buttons
   - Visual indicator for sold items

3. **Search/Filter**
   - Search bar to filter by title, author, or course
   - Case-insensitive search
   - Real-time filtering as user types

4. **Favorites Management**
   - Save listings to favorites for later review
   - Dedicated favorites page
   - Visual indicator for saved items

---

## Technical Specifications

### Technology Stack
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla - No frameworks)
- **Storage:** LocalStorage API
- **Deployment:** Vercel
- **Version Control:** Git

### File Structure
```
/
├── index.html              # Homepage with listings and search
├── add.html               # Form for adding new books
├── favorites.html         # Saved favorites page
├── style.css              # Main stylesheet
├── script.js              # JavaScript for functionality
├── projectDocs/           # Documentation folder
│   └── SecondShelf-PRD.md   # This file
└── README.md              # Project overview
```

### Browser Compatibility
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## User Stories

1. As a student, I want to post my used textbook so others can find it.
2. As a student, I want to search for textbooks for my courses.
3. As a student, I want to save interesting listings to review later.
4. As a student, I want to mark my listing as sold when it's gone.

---

## Design Requirements

### Visual Design
- Clean, modern aesthetic
- Readable fonts (system font stack)
- Simple color scheme: light blue (#4a90e2) + white background
- Card-based layout for book listings
- Responsive design for mobile devices

### User Experience
- Intuitive navigation
- Clear calls-to-action
- Immediate visual feedback on button clicks
- No console errors or warnings
- Fast loading times

---

## Non-Functional Requirements

### Performance
- Page load time < 2 seconds
- Smooth scrolling and transitions
- No layout shifts

### Accessibility
- Semantic HTML5 elements
- Proper heading hierarchy
- Alt text for icons (emoji used as visual aids)
- Keyboard navigation support

### Code Quality
- Clean, well-commented code
- Consistent formatting
- No inline CSS or JavaScript
- Separated concerns (HTML, CSS, JS)

---

## Future Enhancements (Post-MVP)

### Weeks 2-3
- Add book condition field
- Photo upload option for book covers
- Messaging/contact form integration
- Enhanced favorites features

### Weeks 4-5
- User accounts/login system (optional)
- Campus/location filter for multi-campus schools
- Email notifications for new matches

### Week 6+
- Rating/review system for trusted users
- Advanced search filters (price range, condition)
- Mobile app development
- Integration with campus bookstore

---

## Success Metrics

- **User Engagement:** Number of listings created
- **Search Usage:** Frequency of search bar usage
- **Favorites:** Number of saved favorites
- **Completion Rate:** % of listings marked as sold

---

## Constraints and Assumptions

### Constraints
- No backend server required (localStorage only)
- No database integration
- No authentication system (for MVP)
- Vanilla JavaScript only (no frameworks)

### Assumptions
- Users have modern browsers with localStorage support
- Users will enter data honestly
- Local storage is sufficient for MVP scale
- Users primarily access via desktop or mobile browsers

---

## Timeline

**Week 1:** MVP development
- HTML structure
- CSS styling
- JavaScript functionality
- LocalStorage integration
- Testing and debugging
- Deployment to Vercel

**Weeks 2+:** Feature enhancements (see Future Enhancements)

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| LocalStorage limits exceeded | High | Add data validation, show warnings, implement data cleanup |
| Browser compatibility issues | Medium | Test on multiple browsers, use feature detection |
| Security vulnerabilities | Medium | Validate input, escape HTML, no server-side data storage |
| Poor user experience | High | User testing, iterative design improvements |

---

## Definition of Done

- [x] All MVP features functional
- [x] No console errors
- [x] Responsive design works on mobile
- [x] Code is clean and well-commented
- [x] Deployed to Vercel
- [x] README includes deployment link
- [x] Git commits are logical and documented

---

**Last Updated:** December 2024  
**Project Status:** In Development
