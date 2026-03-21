import { generateText, Output } from 'ai';
import { z } from 'zod';

interface Transcript {
  role: string,
  content: string
}

function serializeTranscript(transcript: Transcript[]) {
  return transcript
    .map(({ role, content }) => `${role}: ${content}`)
    .join('\n');
}

export async function transcriptSummary(
  transcript: Transcript[]
) {
  const serializedTranscript = serializeTranscript(transcript);

  const { output } = await generateText({
    model: 'openai/gpt-4o-mini',
    output: Output.object({
      schema: z.object({
        notes: z.array(
          z.object({
            note: z.string(), reason: z.string(
            )
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
- Provide an overall severity score from 1 to 10, where:
  - 1 = low concern
  - 10 = immediate critical concern

Output requirements:
- Return structured output with:
  - notes: array of objects with { note, reason }
  - severity: a number from 1 to 10

Transcript:
${serializedTranscript}
`.trim(),
  });

  return output
}