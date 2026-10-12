# Client Photo Delivery Platform (Cloudinary Backend)

Full-stack client photo delivery web app where photos and gallery metadata live entirely in Cloudinary storage without browser storage dependency.

## Environment Variables

Create a `.env` file in the root directory:

```env
# Cloudinary Credentials (Server-side)
CLOUDINARY_CLOUD_NAME=bzimyrvw
CLOUDINARY_API_KEY=261693571528566
CLOUDINARY_API_SECRET=k3bB19N7cGDzK7Qjvtu3u6lI6iI
CLOUDINARY_URL=cloudinary://261693571528566:k3bB19N7cGDzK7Qjvtu3u6lI6iI@bzimyrvw

# Photographer Admin Authentication
ADMIN_PASSWORD=julian2026

# Client-side Cloudinary Cloud Name
VITE_CLOUDINARY_CLOUD_NAME=bzimyrvw
```

> **Security Note:** Cloudinary API Secret (`CLOUDINARY_API_SECRET`) lives exclusively on the Express server and is NEVER exposed to the client browser.

## How to Run

### Installation
```bash
npm install
```

### Development Mode
Starts Express server + Vite middleware on port 3000:
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

## Architecture & Code Structure

- **`server/index.ts` & `server/cloudinary.ts`**: Express backend using the official `cloudinary` Node SDK. Handles signed upload signature generation, raw JSON gallery metadata (`clients/{galleryId}/meta.json`), photo listings with `next_cursor` pagination, and gallery deletion.
- **`src/lib/api.ts`**: API client layer for backend endpoints and direct signed browser-to-Cloudinary image uploads.
- **`src/lib/cloudinaryUrls.ts`**: Transformation helper functions generating optimized URLs (`w_800` grid, `w_1800` viewer, `w_30` blurred placeholders, `fl_attachment` download).
- **`src/types.ts`**: Unified TypeScript interfaces for `Gallery`, `Photo`, `Photographer`, `Collection`, and `ActivityEvent`.
