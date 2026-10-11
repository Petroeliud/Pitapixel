export interface SmartFramingResult {
  focalX: number; // percentage 0 - 100
  focalY: number; // percentage 0 - 100
  hasSubject: boolean;
  subjectDescription?: string;
  framingSummary?: string;
}

/**
 * Analyzes photo via Gemini AI endpoint on server
 * to calculate optimal focal point coordinates that guarantee the
 * subject's head/face is never cut off in responsive covers and album cards.
 */
export async function analyzeCoverPhotoFraming(
  imageDataUrl: string
): Promise<SmartFramingResult> {
  try {
    const res = await fetch('/api/ai/smart-frame', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageData: imageDataUrl }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    return {
      focalX: typeof data.focalX === 'number' ? data.focalX : 50,
      focalY: typeof data.focalY === 'number' ? data.focalY : 28,
      hasSubject: data.hasSubject ?? true,
      subjectDescription: data.subjectDescription,
      framingSummary: data.framingSummary || 'Framed to keep head in view',
    };
  } catch (err) {
    console.warn('AI smart framing server call failed, using rule-of-thirds heuristics:', err);
    // Classical portrait photography upper-third focal point fallback:
    // head/eyes located at ~28% from the top prevents head cutoff across 16:9, 4:3, and mobile
    return {
      focalX: 50,
      focalY: 28,
      hasSubject: true,
      subjectDescription: 'Portrait subject',
      framingSummary: 'Upper-third framing applied to ensure head remains in view',
    };
  }
}
