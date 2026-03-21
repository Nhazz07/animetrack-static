# 🎌 AnimeTrack — Static Version (HTML + CSS + JS)

No server needed. Just open in browser!

## 📁 Structure
```
animetrack/
├── index.html          ← Homepage
├── css/
│   └── app.css         ← ALL styles (external CSS file)
├── js/
│   └── app.js          ← ALL JavaScript (external JS file)
├── images/
│   └── placeholder.svg ← Default poster
└── pages/
    ├── browse.html     ← Browse & filter anime
    ├── search.html     ← Search anime
    ├── favorites.html  ← Your saved favorites
    └── watchlist.html  ← Your watchlist with status tracking
```

## ▶️ How to Open

**Just double-click `index.html`** — that's it! 🎉

Or right-click → "Open with" → your browser (Chrome, Firefox, Edge).

## ✨ Features

- 🔥 **Homepage** — Trending, Top Rated, and Airing Now sections
- 🔍 **Live Search** — Search bar in the nav with instant dropdown results
- 📺 **Browse** — Filter by category and genre with pagination
- 🔎 **Search Page** — Full search with popular quick-tags and load more
- ★  **Favorites** — Save and manage your favorite anime
- ◷  **Watchlist** — Track anime with status (Watching / Completed / Dropped / Plan to Watch)
- 🎬 **Detail Modal** — Click any card to see full synopsis, score, rank, members, and trailer
- 💾 **Saved Locally** — Favorites and watchlist saved in your browser (localStorage)

## 🌐 API Used

**Jikan API** (https://jikan.moe) — Free, no API key needed.
Pulls real data from MyAnimeList.

## ⚠️ Note

Because this uses an external API, you need an **internet connection** for anime data to load.
Your favorites and watchlist are saved **in your browser** and stay there between visits.
