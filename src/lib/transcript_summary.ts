import { generateText, Output } from 'ai';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';

export async function transcriptSummary(transcript: string) {
  try {
    const { output } = await generateText({
      model: openai('gpt-4o-mini'),
      output: Output.object({
        schema: z.object({
          notes: z.array(
            z.object({
              note: z.string().min(1).max(100),
              reason: z.string().min(1).max(100),
            }),
          ),
          severity: z.number().int().min(1).max(10),
        }),
      }),
      prompt: `
You are analyzing a call transcript between a user and a suicide hotline agent.

Task:
- Extract the most important notes from the transcript.
- For each note, include a short reason explaining why it matters.
- Provide an overall severity score from 1 to 10.

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