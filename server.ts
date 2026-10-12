import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { GoogleGenAI, Type } from '@google/genai';
import {
  saveGalleryMeta,
  getGalleryMeta,
  getGalleryPhotos,
  generateUploadSignature,
  listAllGalleries,
  deletePhotoByPublicId,
  deleteGalleryAndContents,
  GalleryMeta,
} from './server/cloudinary.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'julian2026';

app.use(express.json({ limit: '25mb' }));

/**
 * Middleware to verify admin password header
 */
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const provided = req.headers['x-admin-password'];
  if (provided === ADMIN_PASSWORD) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized: Invalid admin password' });
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * OpenGraph Link Preview Server-Side Handler for /g/{shareId}
 */
async function renderGalleryHtmlPage(req: express.Request, res: express.Response) {
  const rawId = req.params.shareId || '';
  const shareId = rawId ? rawId.split('?')[0].split('#')[0].replace(/\/$/, '').trim() : '';

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'bzimyrvw';
  const baseUrl = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  const canonicalUrl = `${baseUrl}/g/${encodeURIComponent(shareId)}`;

  // Default neutral 1200x630 dark fallback preview image
  const neutralImage = `https://res.cloudinary.com/${cloudName}/image/upload/w_1200,h_630,c_fill,b_rgb:09090b,q_auto,f_jpg/sample`;

  let ogTitle = 'Gallery Not Found';
  let ogDesc = 'The requested client photo gallery link is not available or has expired.';
  let ogImage = neutralImage;

  if (shareId) {
    try {
      const meta = await getGalleryMeta(shareId);
      if (meta) {
        const isExpired = meta.expiresAt
          ? new Date(meta.expiresAt).getTime() < Date.now()
          : false;

        if (isExpired) {
          ogTitle = 'Gallery Expired';
          ogDesc = 'This photo gallery link is no longer available.';
          ogImage = neutralImage;
        } else if (meta.password) {
          // Password-protected galleries: MUST NOT expose cover photo or details
          ogTitle = 'Private gallery';
          ogDesc = 'This photo gallery is password protected.';
          ogImage = neutralImage;
        } else {
          // Public active gallery
          const photos = await getGalleryPhotos(shareId);
          ogTitle = escapeHtml(meta.title);

          const clientText = meta.clientName ? `${escapeHtml(meta.clientName)} · ` : '';
          const photoCount = photos.length;
          ogDesc = `${clientText}${photoCount} ${photoCount === 1 ? 'photo' : 'photos'} delivered`;

          // Cover photo 1200x630 JPEG preview image
          const coverPhoto = photos.find((p) => p.id === meta.coverPhotoId) || photos[0];
          if (coverPhoto) {
            const coverPublicId = coverPhoto.publicId || coverPhoto.id;
            ogImage = `https://res.cloudinary.com/${cloudName}/image/upload/w_1200,h_630,c_fill,q_auto,f_jpg/${coverPublicId}`;
          }
        }
      }
    } catch (err) {
      console.error(`Error generating link preview for /g/${shareId}:`, err);
    }
  }

  // Find index.html template
  let indexPath = path.resolve(__dirname, 'index.html');
  if (!fs.existsSync(indexPath)) {
    indexPath = path.resolve(__dirname, 'dist', 'index.html');
  }

  let htmlTemplate = '';
  try {
    htmlTemplate = fs.readFileSync(indexPath, 'utf-8');
  } catch (err) {
    htmlTemplate = `<!doctype html><html><head><title>${ogTitle}</title></head><body><div id="root"></div></body></html>`;
  }

  // Construct OpenGraph and Twitter card tags
  const ogMetaTags = `
    <title>${ogTitle} — Pitapixel</title>
    <meta name="description" content="${ogDesc}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${ogTitle}" />
    <meta property="og:description" content="${ogDesc}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:site_name" content="Pitapixel Studio" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${ogTitle}" />
    <meta name="twitter:description" content="${ogDesc}" />
    <meta name="twitter:image" content="${ogImage}" />
  `;

  let finalHtml = htmlTemplate.replace(/<title>.*?<\/title>/i, '');
  finalHtml = finalHtml.replace('</head>', `${ogMetaTags}\n</head>`);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(finalHtml);
}

// Route for gallery link previews
app.get('/g/:shareId', renderGalleryHtmlPage);
app.get('/g/:shareId/*', renderGalleryHtmlPage);

/**
 * Admin Login Endpoint
 */
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, message: 'Authenticated successfully' });
  } else {
    res.status(401).json({ success: false, error: 'Incorrect photographer password' });
  }
});

/**
 * POST /api/galleries - Create a new gallery (admin)
 */
app.post('/api/galleries', requireAdmin, async (req, res) => {
  try {
    const { title, clientName, shootDate, customSlug } = req.body;

    if (!title || typeof title !== 'string') {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const randomHex = crypto.randomBytes(6).toString('hex');
    let galleryId = randomHex;

    if (customSlug && typeof customSlug === 'string') {
      const cleaned = customSlug
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '')
        .trim();
      if (cleaned) {
        galleryId = `${cleaned}-${randomHex.substring(0, 4)}`;
      }
    }

    const now = new Date().toISOString();
    const meta: GalleryMeta = {
      id: galleryId,
      shareId: galleryId,
      photographerId: 'admin',
      title: title.trim(),
      clientName: (clientName || '').trim(),
      shootDate: shootDate || now.split('T')[0],
      settings: {
        allowDownload: true,
        allowFavorites: true,
        sizes: ['web', 'original'],
      },
      collections: [],
      favorites: [],
      activity: [],
      viewCount: 0,
      downloadCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    await saveGalleryMeta(galleryId, meta);

    const shareUrl = `/g/${galleryId}`;
    res.json({ gallery: meta, shareUrl, shareId: galleryId });
  } catch (error: any) {
    console.error('Error creating gallery:', error);
    res.status(500).json({ error: error.message || 'Failed to create gallery' });
  }
});

/**
 * GET /api/galleries - List all galleries (admin)
 */
app.get('/api/galleries', requireAdmin, async (_req, res) => {
  try {
    const galleries = await listAllGalleries();
    res.json({ galleries });
  } catch (error: any) {
    console.error('Error listing galleries:', error);
    res.status(500).json({ error: 'Failed to fetch galleries' });
  }
});

/**
 * GET /api/galleries/:id - Get gallery details + photos (public)
 */
app.get('/api/galleries/:id', async (req, res) => {
  try {
    const galleryId = req.params.id;
    if (!galleryId) {
      res.status(400).json({ error: 'Gallery ID is required' });
      return;
    }

    const meta = await getGalleryMeta(galleryId);
    if (!meta) {
      res.status(404).json({ error: 'Gallery not found' });
      return;
    }

    const photos = await getGalleryPhotos(galleryId);

    // Increment view count asynchronously in meta
    meta.viewCount = (meta.viewCount || 0) + 1;
    saveGalleryMeta(galleryId, meta).catch((err) =>
      console.error('Failed to update view count:', err)
    );

    res.json({ gallery: meta, photos });
  } catch (error: any) {
    console.error(`Error fetching gallery ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to load gallery' });
  }
});

/**
 * POST /api/galleries/:id/upload-signature - Generate signature for direct upload (admin)
 */
app.post('/api/galleries/:id/upload-signature', requireAdmin, async (req, res) => {
  try {
    const galleryId = req.params.id;
    const signatureData = generateUploadSignature(galleryId);
    res.json(signatureData);
  } catch (error: any) {
    console.error('Error generating upload signature:', error);
    res.status(500).json({ error: 'Failed to generate upload signature' });
  }
});

/**
 * PATCH /api/galleries/:id - Update gallery metadata (admin)
 */
app.patch('/api/galleries/:id', requireAdmin, async (req, res) => {
  try {
    const galleryId = req.params.id;
    const patch = req.body;

    const currentMeta = await getGalleryMeta(galleryId);
    if (!currentMeta) {
      res.status(404).json({ error: 'Gallery not found' });
      return;
    }

    const updatedMeta: GalleryMeta = {
      ...currentMeta,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    await saveGalleryMeta(galleryId, updatedMeta);
    res.json({ gallery: updatedMeta });
  } catch (error: any) {
    console.error(`Error updating gallery ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update gallery' });
  }
});

/**
 * POST /api/galleries/:id/delete-photo - Delete a photo by public_id (admin)
 */
app.post('/api/galleries/:id/delete-photo', requireAdmin, async (req, res) => {
  try {
    const { publicId } = req.body;
    if (!publicId || typeof publicId !== 'string') {
      res.status(400).json({ error: 'publicId is required' });
      return;
    }

    const success = await deletePhotoByPublicId(publicId);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to delete photo from Cloudinary' });
    }
  } catch (error: any) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

/**
 * DELETE /api/galleries/:id - Delete a gallery and all contents (admin)
 */
app.delete('/api/galleries/:id', requireAdmin, async (req, res) => {
  try {
    const galleryId = req.params.id;
    const success = await deleteGalleryAndContents(galleryId);
    res.json({ success });
  } catch (error: any) {
    console.error(`Error deleting gallery ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete gallery' });
  }
});

// Initialize GoogleGenAI SDK with server-side API key for Smart Framing
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/**
 * AI Smart Framing endpoint
 */
app.post('/api/ai/smart-frame', async (req, res) => {
  try {
    const { imageData } = req.body;

    if (!imageData || typeof imageData !== 'string') {
      res.status(400).json({ error: 'Missing imageData parameter' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.json({
        focalX: 50,
        focalY: 28,
        hasSubject: true,
        subjectDescription: 'Centered portrait subject',
        framingSummary: 'Positioned at upper 28% to keep head and face within upper third rule',
      });
      return;
    }

    let mimeType = 'image/jpeg';
    let base64Data = '';

    if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
      // Fetch image bytes from HTTP URL and convert to Base64
      const imgRes = await fetch(imageData);
      if (!imgRes.ok) {
        throw new Error(`Failed to fetch image from URL: ${imgRes.status} ${imgRes.statusText}`);
      }
      const contentType = imgRes.headers.get('content-type');
      if (contentType) {
        mimeType = contentType.split(';')[0];
      }
      const arrayBuffer = await imgRes.arrayBuffer();
      base64Data = Buffer.from(arrayBuffer).toString('base64');
    } else if (imageData.startsWith('data:')) {
      const match = imageData.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      } else {
        base64Data = imageData.split(',')[1] || imageData;
      }
    } else {
      base64Data = imageData;
    }

    const imagePart = {
      inlineData: {
        mimeType,
        data: base64Data,
      },
    };

    const prompt = `Analyze this photograph for a responsive website hero banner cover photo.
Identify the primary human subject(s) (bride, groom, model, portrait subject, couple).
Locate the position of the subject's head and face so that when this photo is cropped into a wide landscape or mobile hero container, the head of the subject is NEVER cut off.
Return the optimal focal point percentages from 0 to 100:
- focalX: horizontal position (0 = left, 50 = center, 100 = right)
- focalY: vertical position (0 = top, 100 = bottom). Note: To keep the head in frame, focalY should usually align with the subject's head/eyes, often between 15% and 40%.
- hasSubject: boolean
- subjectDescription: short description of the subject
- framingSummary: brief rationale for the selected coordinates.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [imagePart, { text: prompt }],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            focalX: { type: Type.NUMBER },
            focalY: { type: Type.NUMBER },
            hasSubject: { type: Type.BOOLEAN },
            subjectDescription: { type: Type.STRING },
            framingSummary: { type: Type.STRING },
          },
          required: ['focalX', 'focalY', 'hasSubject', 'framingSummary'],
        },
      },
    });

    const resultText = response.text?.trim() || '{}';
    const parsed = JSON.parse(resultText);

    const focalX = Math.max(5, Math.min(95, Math.round(parsed.focalX ?? 50)));
    const focalY = Math.max(5, Math.min(95, Math.round(parsed.focalY ?? 28)));

    res.json({
      focalX,
      focalY,
      hasSubject: parsed.hasSubject ?? true,
      subjectDescription: parsed.subjectDescription || 'Subject in scene',
      framingSummary: parsed.framingSummary || 'Head aligned in upper frame',
    });
  } catch (error: any) {
    console.error('Error in /api/ai/smart-frame:', error);
    res.json({
      focalX: 50,
      focalY: 28,
      hasSubject: true,
      subjectDescription: 'Subject in scene',
      framingSummary: 'Default upper-third framing applied',
    });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
