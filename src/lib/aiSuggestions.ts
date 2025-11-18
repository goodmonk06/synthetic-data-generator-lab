/**
 * OpenAI integration for suggesting generation rules
 */

import OpenAI from 'openai';
import { TableSchema } from './sqlParser';
import { GenerationRules } from './ruleGenerator';

/**
 * Use OpenAI to suggest better generation rules based on column names and types
 */
export async function suggestRulesWithAI(
  schema: TableSchema,
  baseRules: GenerationRules
): Promise<GenerationRules> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('OPENAI_API_KEY not set, skipping AI suggestions');
    return baseRules;
  }

  try {
    const openai = new OpenAI({ apiKey });

    const prompt = `Given a database table with the following schema:

Table: ${schema.tableName}
Columns:
${schema.columns.map(c => `- ${c.name} (${c.type})${c.nullable ? ' NULL' : ' NOT NULL'}${c.primaryKey ? ' PRIMARY KEY' : ''}`).join('\n')}

Current generation rules:
${JSON.stringify(baseRules, null, 2)}

Please suggest improved generation rules that would make the synthetic data more realistic.
For each column, consider:
- Appropriate generators (firstName, lastName, email, phone, address, city, etc.)
- Realistic ranges for numbers
- Appropriate string lengths
- Date ranges that make sense

Return ONLY a valid JSON object with the improved rules, maintaining the same structure as the input.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a data generation expert. Provide realistic generation rules for synthetic data.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.warn('No response from OpenAI, using base rules');
      return baseRules;
    }

    // Extract JSON from response (might be wrapped in code blocks)
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;

    const suggestedRules = JSON.parse(jsonStr);
    console.log('✓ AI suggestions applied');

    return suggestedRules;
  } catch (error) {
    console.warn('Failed to get AI suggestions:', error instanceof Error ? error.message : error);
    return baseRules;
  }
}
