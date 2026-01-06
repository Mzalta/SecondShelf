# SecondShelf

## Project Overview

**SecondShelf** is a web-based textbook marketplace designed specifically for college students. The platform enables students to buy, sell, and trade used textbooks locally on their campus, creating a simple and efficient alternative to traditional bookstores and online marketplaces.

The application provides a streamlined experience for textbook exchanges, eliminating shipping delays and complex logistics while connecting students directly. With AI-powered features for Pro subscribers, SecondShelf helps students find the right books faster and create more effective listings.

### Value Proposition

SecondShelf solves the textbook exchange problem by:
- **Local-first approach**: Connect students on the same campus for instant, in-person transactions
- **Zero shipping costs**: Eliminate shipping fees and delays
- **AI-powered discovery**: Smart search and listing optimization help students find and sell books more effectively
- **Simple user experience**: Clean, intuitive interface designed for busy students
- **Trusted marketplace**: User authentication and secure messaging create a safe environment for transactions

---

## Problem Statement

### The Problem

College students face significant challenges when buying and selling textbooks:

1. **Fragmented marketplace**: Students must navigate multiple platforms (campus bookstores, Facebook groups, online retailers) with no centralized solution
2. **Shipping delays**: Online purchases often arrive after classes begin, leaving students without required materials
3. **High costs**: Campus bookstores charge premium prices, while online platforms add shipping fees and taxes
4. **Poor search experience**: Existing solutions lack intelligent search capabilities, making it difficult to find specific editions or conditions
5. **Coordination complexity**: Arranging meetups, verifying conditions, and managing transactions across different platforms is time-consuming
6. **Limited visibility**: Student listings get buried in social media feeds or lack proper categorization

### Why Existing Solutions Are Insufficient

**Campus Bookstores:**
- Limited operating hours that conflict with class schedules
- Premium pricing with minimal buyback value
- No preview or reservation capabilities
- Rigid policies and limited payment options

**Online Platforms (Amazon, eBay, Chegg):**
- Shipping fees and taxes reduce savings
- Delivery delays (often 1-2 weeks) leave students without materials
- Complex account management across multiple platforms
- Unreliable seller communication

**Social Media Groups:**
- Poor search functionality
- Posts disappear quickly in feeds
- No persistent storage or organization
- Cluttered with non-textbook content
- No verification or trust mechanisms

**The Opportunity**: SecondShelf fills the gap by providing a simple, local-first platform that prioritizes convenience, speed, and intelligent discovery while maintaining the trust and community aspects of campus-based exchanges.

---

## Target Users

### Primary Users

**College Students (Ages 18-24)**
- Students who need textbooks for their courses each semester
- Students looking to sell textbooks after completing courses
- Both buyers and sellers on the same campus

**User Needs:**
- Quick access to required textbooks without waiting weeks for shipping
- Easy way to sell textbooks after courses end
- Simple transactions that fit into busy academic schedules
- Trustworthy platform with verified users
- Intelligent search to find specific editions, conditions, or course materials

### Secondary Users

**Graduate Students & Faculty**
- May need specialized textbooks or reference materials
- Often have more flexibility in timing but still benefit from local exchanges

**Campus Organizations**
- Student groups looking to coordinate bulk textbook exchanges
- Campus bookstores (potential partners for price comparison features)

---

## Core Features

### 1. User Authentication & Profiles

**Description**: Secure authentication system using Google OAuth via Supabase, enabling users to create accounts and manage their profiles.

**User Benefit**: 
- One-click sign-in with Google account
- Secure, verified user base
- Personalized experience with saved preferences
- Access to Pro features and subscription management

**Key Functionality:**
- Google OAuth integration
- User profile management
- Session persistence
- Pro status tracking

---

### 2. Book Listings Management

**Description**: Comprehensive system for creating, editing, and managing textbook listings with rich metadata and image support.

**User Benefit**:
- Easy listing creation with guided forms
- Rich book details (ISBN, edition, condition, description)
- Image uploads for visual verification
- Automatic categorization via AI
- Edit and delete capabilities for listing owners

**Key Functionality:**
- Create new listings with required fields (title, author, course, price, contact)
- Optional fields (ISBN, edition, condition description, full description, tags)
- Image upload (up to 5MB, stored in Supabase Storage)
- Automatic book categorization using AI
- Edit existing listings
- Delete listings
- Mark listings as sold/unsold
- View all user's listings in "My Shelf"

---

### 3. Search & Discovery

**Description**: Dual-mode search system with basic keyword search for all users and AI-powered smart search for Pro subscribers.

**User Benefit**:
- Fast, intuitive search across all listings
- Natural language queries (Pro feature)
- Filter by price, condition, edition, and more
- AI-generated search summaries
- Real-time results as you type

**Key Functionality:**

**Basic Search (All Users):**
- Keyword search across title, author, course, and description
- Case-insensitive matching
- Real-time filtering
- Results count display

**AI Smart Search (Pro Users):**
- Natural language query processing
- Automatic filter extraction (price range, condition, edition, subject)
- Intelligent keyword matching
- AI-generated search summaries
- Rate limiting: 75 searches per day
- Graceful fallback to basic search when rate limited

---

### 4. Favorites System

**Description**: Save interesting listings for later review and easy access.

**User Benefit**:
- Build a personal wishlist of textbooks
- Quick access to saved listings
- Organize potential purchases
- Track listings across sessions

**Key Functionality:**
- Toggle favorite status on any listing
- View all favorites in dedicated page
- Persistent storage (database-backed)
- Empty state handling
- Integration with search and browsing

---

### 5. AI-Enhanced Listings (Pro Feature)

**Description**: Automatic listing optimization using OpenAI to improve titles, descriptions, and discoverability.

**User Benefit**:
- Professional-quality listings with minimal effort
- Optimized titles and descriptions for better search visibility
- Automatic keyword generation
- Price range suggestions based on market data
- Enhanced appeal to potential buyers

**Key Functionality:**
- Automatic enhancement on listing creation (if Pro user provides condition text)
- Optimized title generation
- Enhanced description creation (300-500 characters)
- Keyword extraction (10-15 relevant keywords)
- Price range suggestions
- Rate limiting: 20 enhancements per day
- Graceful error handling with fallback to manual entry

---

### 6. AI Buyer Insights (Pro Feature)

**Description**: AI-generated analysis of listings to help buyers make informed purchasing decisions.

**User Benefit**:
- Condition summary based on listing details
- Fair price range estimation
- Value assessment and insights
- Better purchasing decisions
- Understanding of market value

**Key Functionality:**
- On-demand insights generation for any listing
- Condition assessment summary
- Fair price range calculation
- 3-5 actionable insights per listing
- Rate limiting: 20 insights per day
- Integration with listing detail pages

---

### 7. Messaging System (Pro Feature)

**Description**: In-app messaging system allowing buyers and sellers to communicate directly without revealing personal contact information.

**User Benefit**:
- Private communication with sellers/buyers
- No need to share email or phone publicly
- Organized conversation threads
- Unread message tracking
- Real-time conversation management

**Key Functionality:**
- Start conversations from listings
- View all conversations in inbox
- Send and receive messages
- Unread count tracking
- Conversation threading by listing
- User profile display (avatar, name)
- Timestamp formatting
- Pro subscription required

---

### 8. Subscription Management

**Description**: Stripe-integrated subscription system for Pro features with flexible management options.

**User Benefit**:
- Access to premium AI features and messaging
- Transparent pricing ($9.99/month)
- Easy subscription management
- Cancel or reactivate anytime
- Clear billing information

**Key Functionality:**
- Stripe Checkout integration
- Subscription status tracking
- Active/canceled/trialing status management
- Cancel at period end option
- Reactivation capability
- Billing period display
- Webhook handling for subscription updates
- Automatic Pro status sync

---

### 9. My Shelf

**Description**: Personal dashboard for managing all user's listings with organization by status.

**User Benefit**:
- Centralized view of all listings
- Separate active and sold sections
- Quick actions (edit, delete, mark as sold/unsold)
- Search within personal listings
- Listing count tracking

**Key Functionality:**
- View all user's listings
- Filter by active/sold status
- Search within personal listings
- Edit, delete, mark as sold/unsold
- Empty state handling
- Authentication required

---

### 10. Listing Detail Pages

**Description**: Comprehensive view of individual listings with all details and Pro features.

**User Benefit**:
- Complete listing information
- Visual book representation
- Contact seller information
- Pro AI insights (if Pro user)
- Clear call-to-action

**Key Functionality:**
- Full listing details display
- Image display with fallback
- Category badges
- Condition and metadata display
- Tags display
- Contact information
- Pro AI insights section
- Sold status overlay
- Responsive design

---

### 11. Purchase Tracking

**Description**: System for tracking purchases made through the platform (foundation for future payment integration).

**User Benefit**:
- Transaction history
- Purchase records
- Foundation for future payment features

**Key Functionality:**
- Purchase record creation
- Stripe Payment Intent integration
- Purchase status tracking
- User purchase history

---

## User Flows

### Flow 1: Buying a Textbook

1. **Entry**: User visits homepage or searches for a specific book
2. **Discovery**: Browse listings or use search/AI search to find textbooks
3. **Review**: Click on listing to view details, condition, price, seller contact
4. **Pro Features** (if Pro user): View AI insights for condition and price assessment
5. **Contact**: 
   - Free users: Use provided contact information (email/phone)
   - Pro users: Start in-app conversation with seller
6. **Transaction**: Coordinate meetup and exchange (off-platform)
7. **Completion**: Seller marks listing as sold

### Flow 2: Selling a Textbook

1. **Entry**: User clicks "List Your Book" or navigates to Add page
2. **Authentication**: Sign in with Google (if not already signed in)
3. **Create Listing**: 
   - Fill in required fields (title, author, course, price, contact, name)
   - Optionally add ISBN, edition, condition description, full description
   - Upload book image (optional)
   - Pro users: AI automatically enhances listing on submit
4. **Categorization**: System automatically categorizes book using AI
5. **Submission**: Listing appears on homepage immediately
6. **Management**: User can edit, delete, or mark as sold from "My Shelf"
7. **Communication**: Receive messages from interested buyers (Pro feature)
8. **Completion**: Mark as sold when transaction completes

### Flow 3: Using AI Smart Search (Pro Users)

1. **Entry**: Pro user enters natural language query in search bar (e.g., "calculus textbook under $50 with no highlights")
2. **Processing**: AI extracts filters (subject: Calculus, max_price: 50, no_highlights: true)
3. **Search**: System queries database with extracted filters
4. **Results**: Display matching listings with AI-generated summary
5. **Refinement**: User can edit search or click through to listings
6. **Rate Limiting**: If daily limit (75) reached, falls back to basic keyword search with notification

### Flow 4: Managing Subscription

1. **Entry**: User navigates to Subscription page
2. **Status Check**: System displays current subscription status
3. **Actions**:
   - **No Subscription**: View Pro features, click "Subscribe to Pro", redirect to Stripe Checkout
   - **Active Subscription**: View billing period, cancel option (cancels at period end)
   - **Canceled (Pending)**: Option to reactivate subscription
4. **Checkout**: Complete Stripe payment (if subscribing)
5. **Confirmation**: Redirect back with success status, Pro features activated
6. **Management**: Cancel, reactivate, or view billing details anytime

### Flow 5: Messaging a Seller (Pro Users)

1. **Entry**: Pro user views listing detail page
2. **Initiate**: Click "Message Seller" or start conversation from listing
3. **Conversation**: Navigate to messages page, view conversation thread
4. **Communication**: Send and receive messages in real-time
5. **Organization**: All conversations listed in inbox with unread counts
6. **Completion**: Coordinate transaction through messages

---

## Functional Requirements

### Authentication & Authorization

- **FR-1**: Users must authenticate via Google OAuth to create listings
- **FR-2**: Public users can browse and search listings without authentication
- **FR-3**: Users can only edit/delete their own listings
- **FR-4**: Pro features require active subscription
- **FR-5**: Session persistence across page refreshes

### Listing Management

- **FR-6**: All listings must include: title, author, course, price, contact, poster name
- **FR-7**: Optional fields: ISBN, edition, condition_text, description, tags, image
- **FR-8**: Listings automatically categorized on creation
- **FR-9**: Pro users' listings automatically enhanced if condition_text provided
- **FR-10**: Users can mark listings as sold/unsold
- **FR-11**: Sold listings hidden from public browse (but visible in user's "My Shelf")
- **FR-12**: Image uploads limited to 5MB, image/* types only
- **FR-13**: Price field accepts numeric values, auto-formats with dollar sign

### Search & Discovery

- **FR-14**: Basic keyword search available to all users
- **FR-15**: Search matches across title, author, course, description fields
- **FR-16**: AI smart search available to Pro users only
- **FR-17**: AI search processes natural language queries
- **FR-18**: AI search rate limited to 75 searches per day per Pro user
- **FR-19**: Rate-limited users see notification and fallback to basic search
- **FR-20**: Search results display count and AI summary (if applicable)

### Favorites

- **FR-21**: Authenticated users can save listings to favorites
- **FR-22**: Favorites persist across sessions
- **FR-23**: Users can view all favorites in dedicated page
- **FR-24**: Favorites can be toggled on/off from any listing view

### AI Features (Pro)

- **FR-25**: AI listing enhancement requires Pro subscription and condition_text input
- **FR-26**: AI enhancement rate limited to 20 per day per Pro user
- **FR-27**: AI buyer insights available on-demand for any listing (Pro users)
- **FR-28**: AI insights rate limited to 20 per day per Pro user
- **FR-29**: AI features gracefully degrade if API unavailable
- **FR-30**: Rate limit counters reset every 24 hours

### Messaging (Pro)

- **FR-31**: Messaging available to Pro users only
- **FR-32**: Users can start conversations from listings
- **FR-33**: Conversations organized by listing
- **FR-34**: Unread message counts displayed
- **FR-35**: Messages persist in database

### Subscriptions

- **FR-36**: Stripe Checkout integration for subscription creation
- **FR-37**: Subscription status synced via webhooks
- **FR-38**: Users can cancel subscription (cancels at period end)
- **FR-39**: Users can reactivate canceled subscriptions
- **FR-40**: Pro status updated automatically on subscription changes
- **FR-41**: Subscription billing period displayed to users

### Data Management

- **FR-42**: All listings stored in Supabase database
- **FR-43**: User profiles stored with Pro status and AI usage tracking
- **FR-44**: Images stored in Supabase Storage
- **FR-45**: Row Level Security (RLS) enforces data access policies
- **FR-46**: Users can only access their own data (listings, messages, favorites)

---

## Non-Functional Requirements

### Performance

- **NFR-1**: Page load time < 2 seconds on standard broadband connection
- **NFR-2**: Search results display within 500ms for basic search
- **NFR-3**: AI search results display within 3 seconds (including API call)
- **NFR-4**: Image uploads complete within 5 seconds for files < 5MB
- **NFR-5**: Real-time search filtering with 300ms debounce
- **NFR-6**: Database queries optimized with proper indexing
- **NFR-7**: Client-side state management for responsive UI

### Security

- **NFR-8**: All API routes protected with authentication checks
- **NFR-9**: Row Level Security (RLS) policies enforce data isolation
- **NFR-10**: User input validated and sanitized
- **NFR-11**: Image uploads validated for type and size
- **NFR-12**: API keys stored in environment variables, never exposed to client
- **NFR-13**: Stripe webhooks verified for authenticity
- **NFR-14**: HTTPS required for all production traffic
- **NFR-15**: User sessions managed securely via Supabase Auth

### Scalability

- **NFR-16**: Database designed to handle 10,000+ listings
- **NFR-17**: Image storage scales with Supabase Storage
- **NFR-18**: API rate limiting prevents abuse
- **NFR-19**: Stateless API design for horizontal scaling
- **NFR-20**: Efficient database queries with proper indexing

### Reliability

- **NFR-21**: Graceful error handling for all API calls
- **NFR-22**: Fallback to basic search if AI features unavailable
- **NFR-23**: Retry logic for transient API failures
- **NFR-24**: User-friendly error messages
- **NFR-25**: Database transactions for critical operations
- **NFR-26**: Webhook failure handling and retry mechanisms

### Usability

- **NFR-27**: Responsive design for mobile, tablet, and desktop
- **NFR-28**: Accessible UI with proper ARIA labels
- **NFR-29**: Clear loading states for all async operations
- **NFR-30**: Intuitive navigation and information architecture
- **NFR-31**: Empty states with helpful guidance
- **NFR-32**: Form validation with clear error messages

---

## Tech Stack

### Frontend

- **Framework**: Next.js 14 (React 18)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: 
  - Radix UI (Dialog components)
  - Lucide React (Icons)
  - Custom component library
- **State Management**: Zustand
- **Forms**: React Hook Form with Zod validation
- **Routing**: Next.js App Router

### Backend

- **Runtime**: Node.js (via Next.js API routes)
- **Server Actions**: Next.js Server Actions for form submissions
- **Authentication**: Supabase Auth (Google OAuth)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (for images)
- **API**: RESTful API routes in Next.js

### Database

- **Primary Database**: PostgreSQL (via Supabase)
- **Key Tables**:
  - `books`: Listings data
  - `profiles`: User profiles with Pro status
  - `favorites`: User favorite listings
  - `subscriptions`: Stripe subscription data
  - `purchases`: Purchase tracking
  - `conversations` & `messages`: Messaging system
- **Features**: Row Level Security (RLS), real-time subscriptions, automatic migrations

### Third-Party Services

- **Authentication**: Supabase Auth (Google OAuth provider)
- **Payment Processing**: Stripe (subscriptions and checkout)
- **AI Services**: OpenAI API (GPT-4o-mini for search, categorization, enhancements)
- **Hosting**: Vercel (inferred from deployment files)
- **Image Storage**: Supabase Storage

### Development Tools

- **Package Manager**: npm
- **Type Checking**: TypeScript
- **Linting**: ESLint with Next.js config
- **Build Tool**: Next.js built-in bundler

---

## Assumptions & Constraints

### Assumptions

1. **User Base**: Primary users are college students with Google accounts
2. **Campus Focus**: Platform designed for single-campus or local use (though technically supports any geographic area)
3. **Transaction Model**: Transactions occur off-platform (cash, Venmo, etc.) - no in-app payment processing for individual sales
4. **AI Availability**: OpenAI API is available and within rate limits/quota
5. **Internet Connectivity**: Users have reliable internet access
6. **Device Support**: Users access via modern web browsers (Chrome, Firefox, Safari, Edge)

### Constraints

1. **AI Rate Limits**: 
   - Pro users limited to 75 AI searches per day
   - Pro users limited to 20 AI enhancements/insights per day
   - Limits reset every 24 hours
2. **Image Upload**: Maximum 5MB file size, image types only
3. **Authentication**: Requires Google account (no email/password option)
4. **Pro Features**: Messaging and advanced AI features require active Pro subscription ($9.99/month)
5. **Database**: Relies on Supabase infrastructure and availability
6. **Payment**: Stripe subscription model only (no one-time payments for Pro)
7. **Platform**: Web-only (no native mobile apps)

### Known Limitations

1. **No In-App Payments**: Individual book transactions handled off-platform
2. **No User Ratings**: No rating/review system for sellers
3. **No Notifications**: No email or push notifications (future enhancement)
4. **Single Currency**: USD pricing only
5. **English Only**: Interface and content in English
6. **No Bulk Operations**: Cannot create/edit multiple listings at once
7. **Limited Filtering**: Basic filters available, advanced filtering requires Pro AI search

---

## Future Enhancements

### Short-Term (Next 3-6 Months)

1. **Email Notifications**
   - New message alerts
   - Price drop notifications for favorited listings
   - New listing alerts for saved searches

2. **Enhanced Search Filters**
   - Price range sliders
   - Condition dropdown filters
   - Category filters
   - Date posted filters
   - Available to all users (not just Pro)

3. **User Profiles**
   - Public seller profiles
   - Listing history
   - Response rate metrics
   - Profile customization

4. **Rating & Review System**
   - Post-transaction ratings
   - Seller reviews
   - Trust badges
   - Transaction history

### Medium-Term (6-12 Months)

5. **Mobile Applications**
   - Native iOS app
   - Native Android app
   - Push notifications
   - Camera integration for quick listing creation

6. **In-App Payments**
   - Stripe integration for individual transactions
   - Escrow system
   - Automatic payment on delivery confirmation
   - Refund handling

7. **Campus Integration**
   - Course schedule integration
   - Automatic book recommendations based on registered courses
   - Campus-specific features and branding
   - Integration with campus bookstores for price comparison

8. **Advanced AI Features**
   - Price prediction based on market trends
   - Automatic listing optimization suggestions
   - Smart matching (buyers to sellers)
   - Condition assessment from photos

### Long-Term (12+ Months)

9. **Multi-Campus Expansion**
   - Campus selection
   - Cross-campus trading
   - Regional marketplace features

10. **Social Features**
    - Study groups integration
    - Textbook study notes sharing
    - Course discussion forums
    - Group buying discounts

11. **Analytics Dashboard**
    - Seller analytics (views, favorites, messages)
    - Market trends and pricing insights
    - Best time to list recommendations

12. **Internationalization**
    - Multi-language support
    - Multi-currency support
    - Regional payment methods

---

## Success Metrics

### User Engagement

- **Active Listings**: Target 100+ active listings within first month on a campus
- **User Registration**: 50+ registered users within first month
- **Daily Active Users**: 20+ daily active users after first month

### Transaction Success

- **Listing Completion Rate**: 30%+ of listings result in successful sales
- **Average Time to Sale**: 30% of books sell within 7 days of posting
- **User Retention**: 40%+ of users return within 30 days

### Feature Adoption

- **Pro Subscription Rate**: 10%+ of registered users upgrade to Pro
- **AI Search Usage**: 50%+ of Pro users use AI search weekly
- **Messaging Usage**: 30%+ of Pro users send at least one message
- **Favorites Usage**: 60%+ of users save at least one favorite

### Platform Health

- **Search Success Rate**: 80%+ of searches return relevant results
- **Page Load Performance**: 95%+ of pages load within 2 seconds
- **Error Rate**: < 1% of user actions result in errors
- **Uptime**: 99.5%+ availability

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Stripe account (for subscription features)
- OpenAI API key (for AI features)
- Google OAuth credentials (configured in Supabase)

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see deployment guides)
4. Run database migrations
5. Start development server: `npm run dev`

For detailed setup instructions, see the project documentation files:
- `SUPABASE_SETUP.md`
- `STRIPE_SETUP.md`
- `VERCEL_OPENAI_SETUP.md`
- `DEPLOYMENT_GUIDE.md`

---

## License

ISC

---

## Contact & Support

- **Repository**: [GitHub - SecondShelf](https://github.com/Mzalta/SecondShelf)
- **Issues**: [GitHub Issues](https://github.com/Mzalta/SecondShelf/issues)

---

**Document Version**: 2.0  
**Last Updated**: Based on current codebase analysis  
**Status**: Active Development
