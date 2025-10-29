# 📚 SecondShelf

A simple, local-focused web application that helps college students buy, sell, and trade used textbooks.

## 🎯 Project Description

SecondShelf is a vanilla JavaScript web application designed to solve a common problem for college students: finding affordable textbooks and being able to sell or trade books they no longer need. The application allows students to post listings for textbooks and browse listings from other students on campus, all without the complexity of traditional marketplace platforms.

## ✨ Features

- **Add Book Listings**: Post your textbooks for sale or trade with course information and contact details
- **Browse Listings**: View all available textbooks in a clean, card-based layout
- **Search & Filter**: Find books quickly by title, author, or course
- **Save Favorites**: Save interesting listings for later review
- **Mark as Sold**: Update your listing status when a book is sold

## 🚀 Live Demo

**Deployed Link:** [Coming Soon - Deploy to Vercel] 
 
 
 📄 View Product Requirements Document](./projectDocs/SecondShelf-PRD.md)

## 🛠️ Technology Stack

- **HTML5** - Semantic structure
- **CSS3** - Modern styling with responsive design
- **Vanilla JavaScript** - No frameworks or external dependencies
- **LocalStorage API** - Data persistence
- **Vercel** - Deployment platform

## 📁 Project Structure

```
/
├── index.html              # Homepage with listings and search
├── add.html               # Form for adding new books
├── favorites.html         # Saved favorites page
├── style.css              # Main stylesheet
├── script.js              # JavaScript functionality
├── projectDocs/           # Documentation folder
│   └── SecondShelf-PRD.md   # Product Requirements Document
└── README.md              # This file
```

## 🚦 Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- A code editor (optional, for local development)

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd SecondShelf
```

2. Open the project in your browser:
   - Simply double-click `index.html` to open in your browser, OR
   - Use a local development server (recommended):
     ```bash
     # Using Python 3
     python -m http.server 8000
     
     # Using Node.js (if you have http-server installed)
     npx http-server
     ```

3. Navigate to `http://localhost:8000` in your browser

## 📖 Usage

1. **View Listings**: The homepage displays all available book listings
2. **Add a Book**: Click "Add Book" in the navigation to post a new listing
3. **Search**: Use the search bar to filter by title, author, or course
4. **Save Favorites**: Click the star button on any listing to save it
5. **Mark as Sold**: Click "Mark as Sold" when you've sold your book

## 🎨 Design Features

- Clean, modern UI with a light blue color scheme
- Responsive design that works on desktop and mobile
- Card-based layout for easy browsing
- Smooth hover effects and transitions
- Clear visual indicators for sold items and favorites

## 🔧 Development

### Key Files

- `index.html` - Main homepage layout
- `add.html` - Book listing form
- `favorites.html` - Favorites page
- `style.css` - All styling and responsive design
- `script.js` - All JavaScript functionality including:
  - LocalStorage management
  - DOM manipulation
  - Search/filter logic
  - Form handling

### Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## 📝 Known Limitations

- Data is stored locally (localStorage) and will not persist across different devices
- No authentication or user accounts
- No image uploads (for MVP)
- No messaging system between users

## 🔮 Future Enhancements

- User authentication system
- Photo uploads for book covers
- Email notifications for new matches
- Campus/location filtering
- Rating and review system
- Mobile app version

## 👥 Contributing

This is a class assignment project. For questions or suggestions, please contact the project owner.

## 📄 License

This project is created for educational purposes as a class assignment.

## 🙏 Acknowledgments

- Design inspired by modern marketplace interfaces
- Built with vanilla JavaScript for learning purposes
- Deployed on Vercel for easy access

---

**Last Updated:** December 2024  
**Status:** MVP Complete
