# panda-lsy.github.io

A minimalist black & white personal blog with GitHub Issues CMS and NetEase Cloud Music integration.

## Tech Stack

- **Vite** - Build tooling
- **Vanilla JavaScript** - No framework, modular architecture
- **GitHub Issues API** - CMS for posts (read public, write via PAT)
- **NetEase Cloud Music** - Embedded playlist player
- **marked** - Markdown rendering

## Project Structure

```
src/
  main.js              # Entry point
  router.js            # Hash-based SPA router
  api/
    config.js          # Repo/config constants
    github.js          # GitHub Issues API client
  pages/
    home.js            # Home page (hero + recent posts)
    posts.js           # Posts list with pagination
    post-detail.js     # Single post view
    admin.js           # Admin dashboard (login, CRUD, settings)
  components/
    header.js          # Site navigation
    footer.js          # Footer
    music-player.js    # Floating NetEase player widget
    post-card.js       # Post preview card
    post-editor.js     # Markdown editor form
    pagination.js      # Page navigation
    toast.js           # Notification toasts
  styles/              # CSS (design tokens + component styles)
  utils/
    markdown.js        # Markdown -> HTML (via marked)
    sanitize.js        # HTML sanitizer (XSS prevention)
    storage.js         # localStorage helpers
```

## Getting Started

```bash
npm install
npm run dev
```

## Routes

| Route | Description |
|-------|-------------|
| `#/` | Home page |
| `#/posts` | All posts |
| `#/posts/:id` | Post detail |
| `#/admin` | Admin dashboard |

## Admin

Navigate to `#/admin` and log in with a GitHub Personal Access Token (fine-grained, Issues read/write scope for this repo).

- **Create/edit/delete posts** - stored as GitHub Issues with `post` label
- **Settings** - configure NetEase Cloud Music playlist ID
- **Drafts** - Issues with `draft` label are hidden from public listings

## Scripts

- `npm run dev` - Local dev server
- `npm run build` - Production build
- `npm run preview` - Preview production build
