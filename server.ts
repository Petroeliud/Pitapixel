import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));

// Initialize GoogleGenAI SDK with server-side API key
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
 * Detects the subject and head/face position in the photo so that
 * the cover photo hero keeps the subject's head comfortably in-frame.
 */
app.post('/api/ai/smart-frame', async (req, res) => {
  try {
    const { imageData } = req.body;

    if (!imageData || typeof imageData !== 'string') {
      res.status(400).json({ error: 'Missing imageData parameter' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      // Return smart fallback heuristics if key is not configured in environment
      res.json({
        focalX: 50,
        focalY: 28,
        hasSubject: true,
        subjectDescription: 'Centered portrait subject',
        framingSummary: 'Positioned at upper 28% to keep head and face within upper third rule',
      });
      return;
    }

    // Extract base64 payload & mimeType
    let mimeType = 'image/jpeg';
    let base64Data = imageData;

    if (imageData.startsWith('data:')) {
      const match = imageData.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
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
            focalX: {
              type: Type.NUMBER,
              description: 'Horizontal focal coordinate percentage from 0 to 100',
            },
            focalY: {
              type: Type.NUMBER,
              description: 'Vertical focal coordinate percentage from 0 to 100 centered on subject head/eyes',
            },
            hasSubject: {
              type: Type.BOOLEAN,
              description: 'Whether a clear human subject or focal element was detected',
            },
            subjectDescription: {
              type: Type.STRING,
              description: 'Brief description of the subject',
            },
            framingSummary: {
              type: Type.STRING,
              description: 'Explanation of how the framing ensures the head remains in view',
            },
          },
          required: ['focalX', 'focalY', 'hasSubject', 'framingSummary'],
        },
      },
    });

    const resultText = response.text?.trim() || '{}';
    const parsed = JSON.parse(resultText);

    // Clamp coordinates safely
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
    // Graceful fallback to upper-third framing (standard photography rule for heads/faces)
    res.json({
      focalX: 50,
      focalY: 28,
      hasSubject: true,
      subjectDescription: 'Subject in scene',
      framingSummary: 'Default upper-third framing applied to keep head in frame',
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
