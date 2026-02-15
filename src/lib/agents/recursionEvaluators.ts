import { grokLLM } from '@/lib/grokIntegration';

export async function evaluateTextQuality(
  goal: string,
  output: string
): Promise<{ score: number; feedback: string }>
{
  const response = await grokLLM.invoke([
    {
      role: 'system',
      content:
        'You are a strict evaluator. Return JSON {"score": number 0-1, "feedback": "short"}.',
    },
    {
      role: 'user',
      content: `Goal: ${goal}\nOutput: ${output}`,
    },
  ]);

  const content = typeof response.content === 'string' ? response.content : String(response.content);
  try {
    const parsed = JSON.parse(content);
    if (typeof parsed.score === 'number') {
      return { score: parsed.score, feedback: String(parsed.feedback || '') };
    }
  } catch {
    // fall through
  }

  return { score: 0.5, feedback: 'Could not parse evaluator response.' };
}
