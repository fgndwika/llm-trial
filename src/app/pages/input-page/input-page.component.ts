import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { JsonLogicGeneratorService } from '../../services/json-logic-generator.service';

interface Example {
  input: string;
  output: string;
}

@Component({
  selector: 'app-input-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './input-page.component.html',
  styleUrl: './input-page.component.scss'
})
export class InputPageComponent {
  private readonly openAiService = inject(JsonLogicGeneratorService);

  apiKey = '';
  prompt = '';
  examples: Example[] = [
    { input: '', output: '' }
  ];
  isLoading = false;
  isInitialized = false;
  jsonLogic = '';
  error = '';

  initializeOpenAI(): void {
    if (!this.apiKey) {
      this.error = 'Please provide an API key';
      return;
    }

    try {
      this.openAiService.initializeOpenAI(this.apiKey);
      this.isInitialized = true;
      this.error = '';
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to initialize OpenAI';
      this.isInitialized = false;
    }
  }

  addExample(): void {
    this.examples.push({ input: '', output: '' });
  }

  generateExamples(): void {
    if (!this.prompt) {
      this.error = 'Please provide a prompt';
      return;
    }

    this.isLoading = true;
    this.error = '';
    const previousExamples = this.examples.filter(example => example.input !== '' && example.output !== '');
    
    this.openAiService.generateExamples(this.prompt, previousExamples)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (generatedExamples) => {
          this.examples = [
            ...previousExamples,
            ...generatedExamples.map(example => ({
              input: example.input,
              output: example.output
            }))
          ];
        },
        error: (error) => {
          this.error = error.message || 'Failed to generate examples';
        }
      });
  }

  onSubmit(): void {
    if (!this.prompt || this.examples.length === 0) {
      this.error = 'Please provide prompt and at least one example';
      return;
    }

    this.isLoading = true;
    this.error = '';
    
    this.openAiService.generateJsonLogic(this.prompt, this.examples)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (logic) => {
          this.jsonLogic = logic;
        },
        error: (error) => {
          this.error = error.message || 'Failed to generate JSON logic';
        }
      });
  }

  deleteExample(exampleToDelete: { input: string; output: string }): void {
    this.examples = this.examples.filter(example => example !== exampleToDelete);
  }
} 