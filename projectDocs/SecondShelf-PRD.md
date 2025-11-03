# SecondShelf - Product Requirements Document (PRD)

---

## 1. Executive Summary
**Product Name:** SecondShelf

**SecondShelf** is a website where students can post textbooks they want to sell or trade and browse listings from other students. Users can add book details, search by course or title, and mark books as sold when they’re gone. All listings are stored locally, making it a simple, campus-focused tool for exchanging books efficiently.

### The Problem
College students lack a simple, organized way to buy, sell, and trade textbooks locally. Existing options are fragmented, slow, or overpriced, making it difficult to get the right books quickly or resell them efficiently after the semester ends.

---

## 2. Problem Statement & Opportunity

### The Problem
College students struggle to find and exchange textbooks efficiently at the start of each semester. The current process is fragmented and time-consuming: students must navigate multiple platforms, coordinate shipping, wait days or weeks for delivery, and deal with complex logistics just to get the books they need for their courses. When courses end, there's no streamlined local way to find buyers quickly. Existing solutions are either inconvenient (campus bookstores with limited hours), slow (online shipping delays), or disorganized (social media groups without search capabilities).

### Why This Matters
- **Who's affected:** Millions of college students across the US who need textbooks every semester
- **Frequency:** Students need textbooks every semester, often needing 4-6 books per term
- **Impact:** Students waste valuable time hunting for books across multiple platforms, dealing with shipping delays, and coordinating pickups on busy class schedules
- **Friction:** Current textbook exchanges require multiple steps across different platforms, extended wait times for shipping, and complex coordination that interrupts academic focus

### Current Alternatives & Their Shortcomings

**Campus Bookstores:**
- Limited operating hours that conflict with class schedules
- Requires physical visits during busy transition periods
- No way to preview or reserve books before visiting
- Rigid policies and limited payment options

**Online Platforms (Amazon, eBay, Chegg):**
- Buyers face additional costs like shipping fees and tax, reducing savings.
- Managing multiple accounts and orders across platforms adds unnecessary complexity.
- Communication with sellers can be slow or unreliable, especially for used listings.
- Shipping times often cause delays, leaving students without required materials during the first weeks of class.

**Social Media Groups:**
- Informal and disorganized
- No search or filtering capabilities
- Time-consuming to manually browse and contact sellers
- Posts get buried quickly in feed

**Student Facebook Pages:**
- Poor search functionality
- Posts disappear quickly in feed
- No persistent storage of listings
- Cluttered with non-textbook content

**The Opportunity:** There's a significant gap for a simple, local-first solution that prioritizes convenience and ease of use. SecondShelf fills this gap by creating a streamlined platform that connects students on the same campus instantly, eliminating shipping delays and coordination headaches while making textbook exchanges effortless and fast.

---

## 3. Target Users & User Personas

### Persona 1: Alex, The Busy Commuter Student
- **Who:** 20-year-old computer science major at a state university
- **Background/Context:** Commuter student who works part-time at a coffee shop, has a packed schedule between work and classes
- **Needs:** 
  - Quick access to textbooks without waiting weeks
  - Simple transactions that fit into busy schedule
  - Easy way to sell books after finishing courses
- **Pain points:** Bookstore hours conflict with work schedule, worried about buying wrong editions online, doesn't want to deal with shipping delays or complex coordination
- **Why they need SecondShelf:** Gives Alex instant access to local textbooks without waiting weeks for shipping or visiting stores during limited hours, making book exchanges effortless

### Persona 2: Sarah, The Organized Upperclassman
- **Who:** 22-year-old biology major in her junior year
- **Background:** Has purchased 12+ textbooks over college career, wants to easily sell books from past semesters, lives on campus, has flexible schedule to meet buyers 
- **Needs:**
  - Organized way to track and sell multiple textbooks at once
  - Save favorite listings for courses she'll take next semester
  - Reliable contact method (email preferred)
- **Pain points:** Has accumulated 8-10 textbooks from previous courses taking up space, frustrated by inconvenient buyback processes, wants an organized way to help other students find what they need 
- **Why they need SecondShelf:** Enables Sarah to systematically organize and sell her textbooks quickly through one simple platform, creating an effortless exchange experience

**User Needs Intersection:** Both personas need a simple, trustworthy platform that connects them to other students quickly and efficiently, making textbook exchanges effortless and convenient without the hassle of multiple platforms or complex logistics.

---

## 4. MVP Feature Specifications

### Feature 1: Add Book Listing
**User Story:** As a student, I want to post my used textbook with title, author, price, course, and contact information so that other students can find and purchase it.

**Acceptance Criteria:**
- Form includes required fields: title, author, course, price/trade option, contact info, and poster name
- Form validation prevents submission with empty required fields
- Submitted listings immediately appear on homepage
- Listing data persists in browser localStorage across page refreshes
- Poster name is tracked to ensure only the owner can mark listing as sold

### Feature 2: Browse Book Listings
**User Story:** As a student, I want to view all available textbooks in a clean card layout so that I can quickly scan what's available on campus.

**Acceptance Criteria:**
- All listings display as individual cards on the homepage
- Each card shows: title, author, course, price, contact info, and poster name
- Listings are readable and visually organized
- Card layout is responsive and works on mobile devices
- Empty state message displays when no listings exist

### Feature 3: Search & Filter Listings
**User Story:** As a student, I want to search listings by title, author, or course name so that I can quickly find textbooks relevant to my classes.

**Acceptance Criteria:**
- Search bar appears prominently on homepage
- Real-time filtering updates results as user types
- Search is case-insensitive
- Search matches against title, author, and course fields
- Results count displays showing number of matching listings
- Clear indication when no results match search

### Feature 4: Save to Favorites
**User Story:** As a student, I want to save interesting listings to a favorites list so that I can review and contact sellers later.

**Acceptance Criteria:**
- "Save to Favorites" button appears on every listing
- Button changes to "Saved" state when clicked
- Favorites persist in localStorage
- Favorites page displays all saved listings
- Users can toggle favorites on/off
- Favorites page shows empty state when no favorites exist

### Feature 5: Mark Listing as Sold
**User Story:** As a student, I want to remove my listing when I sell my textbook so that interested buyers know it's no longer available.

**Acceptance Criteria:**
- "Mark as Sold" button only appears on listings owned by current user
- Clicking button permanently removes listing from homepage
- Listing also removed from favorites lists
- Removal persists across page refreshes
- Ownership determined by matching poster name with current user

---

## 5. Future Roadmap

### Week 2-3: Enhanced Listing Features
- **Book Condition Field:** Add dropdown for condition (New, Like New, Good, Fair) to help buyers make informed decisions
- **Photo Upload:** Allow students to upload photos of book cover for visual verification
- **Expanded Favorites:** Add ability to add notes to favorites, share favorites list, and set price alerts

### Week 4-5: Platform Growth Features
- **User Accounts:** Optional login system to track personal listing history and favorite sellers
- **Contact Form Integration:** Add in-app messaging system so students can contact sellers without revealing email/phone publicly
- **Campus Location Filter:** For multi-campus universities, filter listings by specific campus or dorm location
- **Email Notifications:** Alert users when new books match their favorited searches

### Week 6: Trust & Community Features
- **Rating System:** Allow buyers to rate sellers after transactions to build trust
- **User Profiles:** Display seller ratings and transaction history to establish credibility
- **Advanced Search Filters:** Filter by price range, condition, and posting date
- **Campus Integration:** Partner with campus bookstores to display new vs used pricing comparisons
- **Personal Dashboard:** Show users their posted listings, sold history, and earnings summary


### Future Enhancements (Post-MVP):
- Mobile app development for iOS and Android
- Payment integration for in-app transactions
- Textbook price comparison across platforms
- Integration with campus course schedules to show relevant books
- Group buying discounts for multiple books from one seller
- Automated reminders when textbooks for registered courses become available

---

## 6. Success Metrics

### 1. Listings Created
- **Target:** 25+ active listings within first month of launch on a single campus
- **Measurement:** Count of total listings created in localStorage
- **Why it matters:** Indicates platform adoption and active user base

### 2. Listing Completion Rate
- **Target:** 30%+ of postings result in sold transactions
- **Measurement:** Number of listings removed vs total listings created
- **Why it matters:** Proves students are successfully buying and selling, validating the marketplace concept

### 3. Average Time to Sale
- **Target:** 30% of books sell within 7 days of posting
- **Measurement:** Track listing creation date to removal date
- **Why it matters:** Speed of transactions demonstrates the platform's effectiveness in connecting buyers and sellers

---

## 7. Open Questions

### 1. Should we add user verification or keep it anonymous?
We need to decide whether to implement basic student verification (e.g., .edu email requirement) or keep the platform completely anonymous and trust-based. Verification increases trust but adds friction to user registration. Anonymous is faster to launch but could enable fraudulent listings.

### 2. Should we monetize the platform, and if so, how?
If the platform gains traction, we need to determine a revenue model: charge small transaction fees (e.g., 5% on sales), charge listing fees for premium placement, keep it free and monetize later, or seek sponsorship from campus bookstores. This decision impacts user adoption and long-term sustainability.

### 3. Should we prioritize single-campus focus or expand immediately?
We need to decide whether SecondShelf should launch and succeed on one campus first before expanding, or launch broadly across multiple campuses simultaneously. Single-campus allows faster iteration and community building, while multi-campus provides larger marketplace but complex logistics.

### 4. How should we handle dispute resolution between buyers and sellers?
If a student receives a book in worse condition than described, how should we handle this? No policy (caveat emptor), community reporting system, or seller blacklist? This affects user trust and platform reputation versus simplicity of implementation.

### 5. Should we integrate with popular payment apps (Venmo, PayPal) or keep transactions off-platform?
We need to determine whether to facilitate payments within SecondShelf or let students use existing payment methods (cash, Venmo, etc.). On-platform payments increase trust and prevent scams, but off-platform keeps transactions simple and avoids payment processing fees.

---

**Document Version:** 1.0  
**Last Updated:** October 27, 2025  