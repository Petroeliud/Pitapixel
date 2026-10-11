# Frame - Client Photo Delivery Platform

Frame is an ultra-fast, minimal photo delivery web application designed for professional photographers to deliver client galleries through a single unguessable private link with zero client friction (no login, no app install, instant mobile loading).

### User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed during initial review and guide the implementation:

- **Confirmed Decision 1 (Color Scheme)**: Minimal Light default (crisp gallery white `#FFFFFF` with warm neutral `#F4F4F5` / `#18181B` typography), accompanied by an instant Gallery Dark toggle (`#09090B` near-black) for nighttime cinematic viewing.
- **Confirmed Decision 2 (Initial Experience)**: Loads directly into a rich, interactive client gallery preview for a real shoot ("Elena & Marcus — Coastal Wedding", 28 curated high-resolution editorial photos across Ceremony, Portraits, and Reception) with a clean top bar switch allowing instant navigation to the Photographer Dashboard.
- **Confirmed Decision 3 (Data & Storage Strategy)**: Robust browser IndexedDB data engine with pre-seeded high-res collections, full client-side image generation (thumbnails, web-optimized sizes, and originals via Canvas), and a modular repository abstraction pattern ready for direct Firebase Firestore/Storage plug-in.

---

## 1. Overview & Core Concept

- **What It Does**: Allows photographers to upload high-resolution photo batches, organize them into collections, configure security (passwords, expiration dates, download permissions), and share a single unguessable URL (`/g/{shareId}`). Clients open the link on any device to view an aspect-ratio-preserving justified grid, heart favorites, select subsets, or download full-resolution ZIP archives.
- **Target Audience / Persona**:
  - *Clients*: Couples, portrait subjects, and commercial clients opening gallery links via WhatsApp, SMS, or email on mobile devices.
  - *Photographers*: Wedding, event, and portrait photographers needing an elegant, ad-free alternative to Pixieset, Pic-Time, and Google Drive.
- **Key Value**: Zero cognitive overhead, Google Photos-grade justified layout speed, privacy by design, and direct client selection feedback.

---

## 2. User Experience & Visual Design

### Key User Flows

```
[ Photographer Flow ]
Login / Access Dashboard ──> Create Gallery ──> Drag & Drop Photos ──> Auto Thumbnail / Web Resize
                                                        │
                                                        ▼
Activity & Favorites Export <── Share Link & QR Code <── Configure Settings (Password, Expiry, Sizes)

[ Client Flow ]
Open Private Link (/g/{shareId}) ──> (Password Screen if locked) ──> Cover Photo Hero
                                                                          │
                                                                          ▼
Download ZIP Archive <── Multi-Select Mode <── Justified Grid (Google Photos style)
         │                                                        │
         ▼                                                        ▼
"Save to..." (Google Photos / OneDrive / Download)         Full-Screen Lightbox
                                                           (Swipe, EXIF, Heart, Download)
```

1. **Client Gallery Landing**:
   - Hero cover photo with subtle gradient scrim, elegant gallery title, date, client name, and photographer mark.
   - Quick toolbar: "Select", "Download all", "Favorites", and Theme toggle.
   - Collection filter tabs (e.g., "All Photos", "Ceremony", "Portraits", "Reception").
   - Justified grid layout calculating optimal row heights dynamically to display photos with exact original proportions (no square cropping).
   - Blurred low-res placeholders transitioning smoothly to progressive web thumbnails.

2. **Full-Screen Lightbox Viewer**:
   - Tap any photo to enter high-fidelity fullscreen view.
   - Smooth keyboard shortcuts: Left/Right arrows (previous/next), Esc (close), F (favorite), D (download).
   - Touch gestures: touch swipe for mobile navigation, pinch-to-zoom support.
   - Bottom floating controls: photo counter (`04 / 28`), file name, original dimensions, Favorite heart toggle, and direct Single Download button.

3. **Multi-Selection & Batch ZIP Download**:
   - Tap "Select" to enter multi-select mode. Checkboxes appear on photo corners with quick click-to-toggle.
   - Fixed floating bottom thumb bar appears: `"{count} photos selected"`, "Download selected", "Clear selection".
   - Download modal prompts resolution: "Web size" (fast, lightweight for mobile/social) vs "Original" (print-ready full size).
   - Real-time client-side JSZip packaging with progress bar indicator (`0%` -> `100%`) before triggering browser download.

4. **Favorites & Selection Feedback**:
   - Client favorites sync to local state.
   - Client can click "Send selection to photographer" which generates a formatted photographer note and marks the activity feed.
   - Client can view the "Favorites" tab with heart count.

5. **"Save to..." Cloud Integration Flow**:
   - Action sheet with options: "Download to device" (active), "Save to Google Photos" (Coming soon indicator with OAuth extension point), "Save to OneDrive" (Coming soon indicator).

6. **Photographer Dashboard**:
   - Gallery list overview: cover thumbnail, title, photo count, views, download count, and status badge (Active / Expired).
   - Gallery Creator / Editor: Title, client name, date, cover photo selector.
   - Drag-and-drop batch uploader: processes photos in browser worker/canvas to generate `thumb` (400px), `web` (1600px), and retains `original`. File-by-file and total progress bars.
   - Settings Drawer: Toggle downloads, set optional gallery password, set expiration date, toggle favorites, and select enabled download sizes.
   - Activity View: View analytics, download logs, and favorited photo list with a one-click "Copy file names to clipboard" button (for Lightroom filter paste).
   - Sharing Modal: Unguessable URL with "Copy link" feedback and an SVG QR code for direct mobile scanning.

### Visual Identity & Theme

- **Aesthetic Direction**: Minimal editorial gallery, pure photographic focus, zero gradients or decorative pills.
- **Color Palette**:
  - *Light Mode (Default)*: Canvas `#FFFFFF`, sub-surface `#FAFAFA`, borders `#E4E4E7`, text primary `#09090B`, text muted `#71717A`, subtle accent `#18181B`.
  - *Dark Mode*: Canvas `#09090B`, sub-surface `#18181B`, borders `#27272A`, text primary `#FAFAFA`, text muted `#A1A1AA`.
  - *Heart / Favorite Accent*: Soft crimson `#E11D48` when active.
- **Typography**: Clean, neutral neo-grotesque sans-serif (`Inter` / system sans) with tabular figures for image indices and counts (`font-mono tabular-nums`).
- **Icons**: Lucide minimalist 1.5px line icons.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Justified Grid Layout Algorithm**:
  - *Approach*: Implement a greedy row-partitioning justified layout algorithm. Given a target row height (e.g. 260px on mobile, 340px on desktop) and container width, photos are grouped into rows whose combined aspect ratios fit the width, scaling each photo proportionally so all rows align flush left-to-right.
  - *Why*: Exactly mimics Google Photos and professional portfolio galleries without unsightly gaps or harsh square crops that cut off photographer compositions.
- **Decision 2: Client-Side Image Resizing & JSZip Generation**:
  - *Approach*: Utilize HTML5 Canvas `drawImage` with bicubic downsampling to generate `thumb` and `web` previews upon upload. Utilize `jszip` to construct real ZIP archives client-side on demand.
  - *Why*: Instant local performance, works offline or without a costly image processing backend server, and allows instant testing.
- **Decision 3: Storage Repository Architecture (IndexedDB + Mock Seeder + Firebase Plug-in)**:
  - *Approach*: Define a strict TypeScript repository interface (`GalleryRepository`) implemented with IndexedDB and pre-seeded with 28 high-resolution photos.
  - *Why*: Users can immediately test uploads, favorites, downloads, and link sharing, while Firebase Firestore/Storage can be plugged in by swapping the provider.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                               App Shell                                │
│    [Top Switcher: Client Gallery Preview  <─>  Photographer Dashboard] │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
       ┌────────────────────────┐       ┌────────────────────────┐
       │   Client Gallery View  │       │ Photographer Dashboard │
       │  - Cover Photo Hero    │       │  - Galleries Table     │
       │  - Justified Grid      │       │  - Batch Uploader      │
       │  - Fullscreen Lightbox │       │  - Settings Modal      │
       │  - Multi-Select Bar    │       │  - Activity & Export   │
       │  - JSZip Downloader    │       │  - QR Code Share       │
       └────────────┬───────────┘       └────────────┬───────────┘
                    │                                │
                    └────────────────┬───────────────┘
                                     ▼
                      ┌────────────────────────────┐
                      │    Storage & Data Layer    │
                      │  - IndexedDB Persistence   │
                      │  - High-Res Mock Seeder    │
                      │  - Firebase Extension Point│
                      └────────────────────────────┘
```

### Data Schema

```typescript
interface Photographer {
  id: string;
  name: string;
  email: string;
  brandName: string;
}

interface Gallery {
  id: string;
  photographerId: string;
  shareId: string; // Long unguessable token e.g. "k9a2f7c0-d3e4-41b2-8f90-8e1c6a23f5b7"
  title: string;
  clientName?: string;
  date: string;
  coverPhotoId: string;
  password?: string;
  expiresAt?: string;
  settings: {
    allowDownload: boolean;
    allowFavorites: boolean;
    sizes: ('web' | 'original')[];
  };
  collections: Collection[];
  viewCount: number;
  downloadCount: number;
  createdAt: string;
}

interface Photo {
  id: string;
  galleryId: string;
  collectionId?: string;
  fileName: string;
  urls: {
    thumb: string;
    web: string;
    original: string;
  };
  width: number;
  height: number;
  aspectRatio: number;
  order: number;
  hidden?: boolean;
}
```

---

## 5. Step-by-Step Implementation Plan

1. **Dependencies Installation**:
   - Install `jszip` and `@types/jszip` for client-side ZIP archive building.
2. **Metadata & HTML Setup**:
   - Update `metadata.json` and `index.html` with Frame app title, metadata, and description.
3. **Core Data Layer & Seed Gallery**:
   - Implement `types.ts` for all entities.
   - Implement `storage/db.ts` with IndexedDB persistence and pre-seeded high-res wedding & portrait gallery with real aspect ratios and collections.
4. **Justified Photo Grid Component**:
   - Implement math algorithm for calculating row distribution based on container width and target height.
   - Implement lazy loading and progressive image rendering.
5. **Fullscreen Lightbox & Selection Mode**:
   - Keyboard, swipe, and button navigation.
   - Single download and favorite toggles.
   - Multi-select checkbox overlays with floating bottom bar.
6. **ZIP Download Service & "Save to..." Modal**:
   - Progress bar modal for ZIP bundling with resolution choice.
   - Clean UI for Google Photos & OneDrive cloud options (marked "Coming soon").
7. **Photographer Dashboard**:
   - Gallery manager, settings drawer, upload dropzone with client-side thumbnail/web generation.
   - Activity tracker with "Export favorites to Lightroom list".
   - Share modal with link copy and SVG QR code.
8. **App Switcher & Theme Controller**:
   - Toggle between Client Gallery view (`/g/{shareId}`) and Photographer Dashboard.
   - Light and Dark mode toggle with persisted preference.
9. **Build Verification**:
   - Run compilation and verify responsive design across mobile (375px) and desktop.
