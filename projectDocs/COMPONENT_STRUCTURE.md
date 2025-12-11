# Component Structure - Next.js Migration
## Visual Guide to Component Architecture

---

## 📁 Project Structure

```
second-shelf-nextjs/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (Header, Footer)
│   ├── page.tsx                 # Homepage (/)
│   ├── add/
│   │   └── page.tsx             # Add book page (/add)
│   ├── favorites/
│   │   └── page.tsx             # Favorites page (/favorites)
│   ├── book/
│   │   └── [id]/
│   │       └── page.tsx         # Book detail page (/book/:id)
│   └── api/                     # API routes (if needed)
│       └── books/
│           └── route.ts
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx           # Main navigation header
│   │   ├── Footer.tsx           # Footer component
│   │   ├── Navbar.tsx           # Navigation links
│   │   └── Layout.tsx           # Wrapper component
│   │
│   ├── features/
│   │   ├── books/
│   │   │   ├── BookCard.tsx     # Individual book card
│   │   │   ├── BookList.tsx     # List of books
│   │   │   ├── BookGrid.tsx     # Grid container
│   │   │   └── BookDetail.tsx   # Book detail view
│   │   │
│   │   ├── search/
│   │   │   ├── SearchBar.tsx    # Search input
│   │   │   ├── FilterPanel.tsx  # Advanced filters
│   │   │   └── ResultsCount.tsx # Results display
│   │   │
│   │   ├── favorites/
│   │   │   ├── FavoritesList.tsx
│   │   │   └── FavoriteButton.tsx
│   │   │
│   │   └── forms/
│   │       └── AddBookForm.tsx  # Book listing form
│   │
│   └── ui/                       # Reusable UI components
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── Toast.tsx
│       ├── Loading.tsx
│       ├── Badge.tsx
│       └── EmptyState.tsx
│
├── lib/
│   ├── store/
│   │   └── useBookStore.ts      # Zustand store
│   ├── hooks/
│   │   ├── useBooks.ts
│   │   ├── useFavorites.ts
│   │   ├── useSearch.ts
│   │   └── useDebounce.ts
│   ├── api/
│   │   ├── client.ts            # API client
│   │   ├── books.ts             # Book API calls
│   │   └── favorites.ts         # Favorites API calls
│   └── utils/
│       ├── format.ts            # Formatting utilities
│       └── validation.ts        # Validation helpers
│
├── types/                        # TypeScript types
│   └── index.ts
│
├── styles/
│   └── globals.css              # Global styles
│
└── public/                       # Static assets
    ├── images/
    └── icons/
```

---

## 🧩 Component Hierarchy

### Homepage (`app/page.tsx`)
```
Layout
├── Header
│   └── Navbar
├── Hero
├── SearchSection
│   ├── SearchBar
│   └── ResultsCount
└── BookListings
    └── BookGrid
        └── BookCard (multiple)
            ├── FavoriteButton
            └── MarkAsSoldButton (if owner)
└── Footer
```

### Add Book Page (`app/add/page.tsx`)
```
Layout
├── Header
│   └── Navbar
├── AddBookForm
│   ├── FormInput (title)
│   ├── FormInput (author)
│   ├── FormInput (course)
│   ├── FormInput (price)
│   ├── FormInput (contact)
│   ├── FormInput (poster name)
│   └── Button (submit)
└── Footer
```

### Favorites Page (`app/favorites/page.tsx`)
```
Layout
├── Header
│   └── Navbar
├── FavoritesList
│   └── BookGrid
│       └── BookCard (multiple)
│           └── FavoriteButton
└── Footer
```

---

## 📦 Component Specifications

### Layout Components

#### `Header.tsx`
```tsx
interface HeaderProps {
  currentPath?: string;
}

// Features:
// - Logo with link to home
// - Navigation links
// - Mobile hamburger menu
// - Active route highlighting
```

#### `Navbar.tsx`
```tsx
interface NavbarProps {
  currentPath: string;
}

// Features:
// - Home, Add Book, Favorites links
// - Active state styling
// - Mobile responsive
```

#### `Layout.tsx`
```tsx
interface LayoutProps {
  children: React.ReactNode;
}

// Features:
// - Wraps all pages
// - Includes Header and Footer
// - Consistent spacing
```

### Book Components

#### `BookCard.tsx`
```tsx
interface BookCardProps {
  book: Book;
  index: number;
  isFavorite?: boolean;
  isOwner?: boolean;
  onToggleFavorite: (id: string) => void;
  onMarkAsSold?: (id: string) => void;
}

// Features:
// - Book information display
// - Favorite button
// - Mark as sold button (if owner)
// - Hover effects
// - Link to detail page
```

#### `BookList.tsx`
```tsx
interface BookListProps {
  books: Book[];
  isLoading?: boolean;
}

// Features:
// - Renders list of BookCard components
// - Loading skeleton
// - Empty state
```

#### `BookGrid.tsx`
```tsx
interface BookGridProps {
  children: React.ReactNode;
  columns?: number;
}

// Features:
// - Responsive grid layout
// - Mobile: 1 column
// - Tablet: 2 columns
// - Desktop: 3-4 columns
```

### Search Components

#### `SearchBar.tsx`
```tsx
interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

// Features:
// - Debounced input
// - Search icon
// - Clear button
// - Keyboard shortcuts
```

#### `FilterPanel.tsx`
```tsx
interface FilterPanelProps {
  onFilterChange: (filters: Filters) => void;
}

// Features:
// - Price range slider
// - Course filter
// - Condition filter
// - Clear all button
```

### Form Components

#### `AddBookForm.tsx`
```tsx
interface AddBookFormProps {
  onSubmit: (data: BookFormData) => void;
}

// Features:
// - Form validation
// - Error messages
// - Success state
// - Loading state
// - Form reset
```

### UI Components

#### `Button.tsx`
```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'favorite';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}
```

#### `Card.tsx`
```tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}
```

#### `Input.tsx`
```tsx
interface InputProps {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
}
```

---

## 🔄 Data Flow

### Current (Vanilla JS)
```
localStorage → script.js → DOM manipulation
```

### New (Next.js)
```
Zustand Store → React Components → UI Updates
     ↓
localStorage (persistence)
     ↓
API (future)
```

### State Management Flow
```
User Action
    ↓
Component Event Handler
    ↓
Zustand Store Action
    ↓
Store State Update
    ↓
Component Re-render
    ↓
UI Update
```

---

## 🎨 Styling Approach

### Tailwind CSS Classes
```tsx
// Example: BookCard component
<div className="
  bg-white rounded-lg shadow-md p-6
  hover:shadow-lg transition-shadow
  border border-gray-200
">
  <h3 className="text-xl font-semibold text-gray-900 mb-2">
    {book.title}
  </h3>
  <div className="space-y-1 text-sm text-gray-600">
    <p><strong>Author:</strong> {book.author}</p>
    <p><strong>Course:</strong> {book.course}</p>
    <p><strong>Price:</strong> {book.price}</p>
  </div>
</div>
```

### Component Variants
```tsx
// Button variants
const buttonVariants = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
  danger: "bg-red-600 text-white hover:bg-red-700",
  favorite: "bg-yellow-400 text-gray-900 hover:bg-yellow-500"
}
```

---

## 🚀 Migration Mapping

### Current → Next.js

| Current File | Next.js Equivalent |
|-------------|-------------------|
| `index.html` | `app/page.tsx` |
| `add.html` | `app/add/page.tsx` |
| `favorites.html` | `app/favorites/page.tsx` |
| `script.js` | `lib/store/useBookStore.ts` + Components |
| `style.css` | `styles/globals.css` + Tailwind |
| `localStorage` | Zustand with persistence |

### Function Mapping

| Current Function | Next.js Equivalent |
|----------------|-------------------|
| `displayListings()` | `<BookList books={listings} />` |
| `createBookCard()` | `<BookCard book={book} />` |
| `toggleFavorite()` | `useBookStore().toggleFavorite()` |
| `handleFormSubmit()` | `react-hook-form` + `onSubmit` |
| `setupSearch()` | `<SearchBar onSearch={handleSearch} />` |

---

## 📝 Component Checklist

### Phase 1: Core Layout
- [ ] `Layout.tsx`
- [ ] `Header.tsx`
- [ ] `Navbar.tsx`
- [ ] `Footer.tsx`

### Phase 2: Book Components
- [ ] `BookCard.tsx`
- [ ] `BookList.tsx`
- [ ] `BookGrid.tsx`
- [ ] `EmptyState.tsx`

### Phase 3: Search & Filter
- [ ] `SearchBar.tsx`
- [ ] `FilterPanel.tsx`
- [ ] `ResultsCount.tsx`

### Phase 4: Forms
- [ ] `AddBookForm.tsx`
- [ ] `FormInput.tsx`
- [ ] `FormSelect.tsx`

### Phase 5: UI Components
- [ ] `Button.tsx`
- [ ] `Card.tsx`
- [ ] `Modal.tsx`
- [ ] `Toast.tsx`
- [ ] `Loading.tsx`
- [ ] `Badge.tsx`

---

**This structure provides a clear roadmap for component development during migration.**
