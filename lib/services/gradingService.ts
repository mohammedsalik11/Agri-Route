/**
 * AI produce grading service using Gemini Vision API.
 * Falls back to deterministic hash-based grading when MOCK_GRADING=true.
 */

export interface GradeResult {
  grade: 'A' | 'B' | 'C';
  confidence: number;
  defects: string[];
  notes: string;
  source: 'ai' | 'mock';
}

const GRADING_PROMPT = `You are grading Indian agricultural produce for a wholesale marketplace.
Return ONLY valid JSON, no markdown fences, no preamble:
{"grade":"A"|"B"|"C","confidence":0.0-1.0,"defects":[string],"notes":string}
Grade A: uniform size and colour, no visible damage, market-ready.
Grade B: minor blemishes or size variation, saleable.
Grade C: visible damage, overripeness, or heavy variation; suited to processing.
If the image is not agricultural produce, return grade "C" with confidence 0.`;

/**
 * Grade produce from a photo using Gemini Vision API.
 */
export async function gradeProduceFromPhoto(
  photoBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<GradeResult> {
  const mockGrading = process.env.MOCK_GRADING === 'true';

  if (mockGrading || !process.env.VISION_API_KEY) {
    return mockGrade(photoBase64);
  }

  try {
    const apiKey = process.env.VISION_API_KEY;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: GRADING_PROMPT },
                {
                  inlineData: {
                    mimeType,
                    data: photoBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 256,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error('Gemini API error:', response.status);
      return mockGrade(photoBase64);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Strip markdown fences if present
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const parsed = JSON.parse(cleaned);

    return {
      grade: (['A', 'B', 'C'].includes(parsed.grade) ? parsed.grade : 'B') as 'A' | 'B' | 'C',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
      defects: Array.isArray(parsed.defects) ? parsed.defects : [],
      notes: typeof parsed.notes === 'string' ? parsed.notes : '',
      source: 'ai',
    };
  } catch (error) {
    console.error('Grading error, falling back to mock:', error);
    return mockGrade(photoBase64);
  }
}

/**
 * Deterministic mock grader: hashes the first 100 chars of base64 → A/B/C.
 */
function mockGrade(photoBase64: string): GradeResult {
  const sample = photoBase64.slice(0, 100);
  let hash = 0;
  for (let i = 0; i < sample.length; i++) {
    hash = ((hash << 5) - hash + sample.charCodeAt(i)) | 0;
  }
  const grades: Array<'A' | 'B' | 'C'> = ['A', 'B', 'C'];
  const grade = grades[Math.abs(hash) % 3];

  const mockDefects: Record<string, string[]> = {
    A: [],
    B: ['Minor size variation'],
    C: ['Surface blemishes', 'Uneven ripeness'],
  };

  const mockNotes: Record<string, string> = {
    A: 'Produce appears uniform and market-ready',
    B: 'Minor quality variations detected, saleable',
    C: 'Quality issues detected, suited for processing',
  };

  return {
    grade,
    confidence: grade === 'A' ? 0.85 : grade === 'B' ? 0.78 : 0.72,
    defects: mockDefects[grade],
    notes: mockNotes[grade],
    source: 'mock',
  };
}
