import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EmojiPickerComponent } from "./emoji-picker/emoji-picker.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ EmojiPickerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'my-emoji-picker-app';
  chosenEmoji = signal<string | null>(null); // Use a signal for the chosen emoji

  handleEmojiSelection(emoji: string): void {
    this.chosenEmoji.set(emoji); // Update the signal
    console.log('Emoji selected:', emoji);
    // You can do more here, like close the picker, insert into a textarea, etc.
  }
}
