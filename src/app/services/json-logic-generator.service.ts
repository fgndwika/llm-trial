import { Injectable } from '@angular/core';
import { OpenAI } from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod.mjs';
import { Observable, from } from 'rxjs';
import { z } from 'zod';

interface Example {
  input: string;
  output: string;
}

const examplesSchema = z.object({
  examples: z.array(z.object({
    input: z.string(),
    output: z.string()
  }))
});

@Injectable({
  providedIn: 'root'
})
export class JsonLogicGeneratorService {
  private openai: OpenAI | null = null;

  initializeOpenAI(apiKey: string): void {
    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true // Note: In production, you should use a backend service
    });
  }

  generateExamples(prompt: string, previousExamples: Example[]): Observable<Example[]> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized. Please set API key first.');
    }
    const openai: OpenAI = this.openai;

    const systemPrompt = `You are a helpful assistant that generates input/output examples based on a given prompt. 
    These examples will be used to generate a JSON logic rule.
    Generate 3 realistic examples that demonstrate the logic described.
    Respond only with a JSON array of objects with 'input' (string) and 'output' (string) properties.
    Generate examples that are different from the previous examples.
    Example: { "examples": [{"input": "...", "output": "..."}, {"input": "...", "output": "..."}, {"input": "...", "output": "..."}] }`;
    
    const previousExamplesStr = previousExamples.length > 0 ? JSON.stringify(previousExamples, null, 2) : '';

    const userPrompt = `
    Prompt: ${prompt}
    
    Previous examples:
    ${previousExamplesStr}
    `;

    return from((async () => {
      const completion = await openai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: 'gpt-4o-mini',
        temperature: 0.5,
        response_format: zodResponseFormat(examplesSchema, 'examples')
      });

      console.log(completion);
      const response = JSON.parse(completion.choices[0].message.content ?? '{}');
      return response.examples as Example[];
    })());
  }

  generateJsonLogic(
    prompt: string, 
    examples: Example[]
  ): Observable<string> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized. Please set API key first.');
    }
    const openai: OpenAI = this.openai;

    const examplesStr = JSON.stringify(examples, null, 2);
    const systemPrompt = `You are a helpful assistant that generates json-logic rules based on a description and examples.
    The response should be a valid json-logic rule as a JSON string.
    Only respond with the json-logic rule, nothing else.`;

    const userPrompt = `
    Description: ${prompt}
    
    Examples:
    ${examplesStr}
    
    Generate a json-logic rule that satisfies these requirements.`;

    return from((async () => {
      const completion = await openai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: 'gpt-4o-mini',
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      return completion.choices[0].message.content ?? '';
    })());
  }
} 