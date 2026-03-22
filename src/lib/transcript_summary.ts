import { generateText, Output } from 'ai';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';

export async function transcriptSummary(transcript: string) {
  try {

    console.log(transcript);
    const { output } = await generateText({
      model: openai('gpt-4.1'),
      output: Output.object({
        schema: z.object({
          notes: z.array(
            z.object({
              note: z.string(),
              reason: z.string(),
            }),
          ),
          severity: z.number().int().min(1).max(10),
        }),
      }),
      prompt: `
You are analyzing a call transcript between a caller and a suicide hotline agent.

Output rules:
- Return a small set of consolidated notes—typically 3 to 8 items. Err on fewer, higher-quality notes rather than many fragments.
- Merge overlapping facts, repeated themes, and adjacent details into one note. Do not create a separate note for every sentence or turn of speech.
- Each note must synthesize a theme, risk factor, protective factor, or clinically relevant pattern drawn from multiple parts of the conversation when the transcript supports it. Avoid notes that restate a single isolated sentence or one-off remark unless it is uniquely critical (e.g., explicit plan or means).
- Each reason should state why that theme matters for safety, follow-up, or supervision—not a duplicate of the note text.

Severity (1–10): reflect imminent risk, hopelessness, access to means, substance use, isolation, and similar factors consistent with crisis-line assessment.

Make the notes and reason short and concise.

Transcript:
${transcript}
`.trim(),
    });

    // ✅ fallback protection
    if (!output) {
      return {
        notes: [],
        severity: 1,
      };
    }

    return output;

  } catch (error) {
    console.error('Error generating transcript summary', error);

    // ✅ never crash webhook
    return {
      notes: [],
      severity: 1,
    };
  }
}