import { Component, signal, computed, Output, EventEmitter, OnInit, inject, DestroyRef, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop'; // Import for cleanup if needed, or use constructor effect
import emojiData from 'unicode-emoji-json';  

interface Emoji {
  emoji: string;
  name: string;
  category: string;
}

const RECENT_EMOJIS_STORAGE_KEY = 'angular_emoji_picker_recent';
const MAX_RECENT_EMOJIS = 20;
const RECENT_SECTION_NAME = 'Recently Used';

@Component({
  selector: 'app-emoji-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './emoji-picker.component.html',
  styleUrl: './emoji-picker.component.scss',
})
export class EmojiPickerComponent implements OnInit {

  private allEmojis = signal<Emoji[]>([]);
  searchTerm = signal<string>('');
  private recentEmojis = signal<Emoji[]>([]);
  activeSectionName = signal<string | null>(null);

  private categorizedEmojis = computed(() => {
    const categories: { [key: string]: Emoji[] } = {};
    this.allEmojis().forEach(emoji => {
      if (!categories[emoji.category]) {
        categories[emoji.category] = [];
      }
      categories[emoji.category].push(emoji);
    });
    const sortedKeys = Object.keys(categories).sort();
    const sortedCategories: { [key: string]: Emoji[] } = {};
    sortedKeys.forEach(key => {
        sortedCategories[key] = categories[key];
    });
    return sortedCategories;
  });

  sectionTabs = computed(() => {
    const tabs: string[] = [];
    if (this.recentEmojis().length > 0) {
        tabs.push(RECENT_SECTION_NAME);
    }
    tabs.push(...Object.keys(this.categorizedEmojis()));
    return tabs;
  });

  currentSectionEmojis = computed(() => {
    const activeTab = this.activeSectionName();
    if (!activeTab) {
        return []; 
    }

    if (activeTab === RECENT_SECTION_NAME) {
        return this.recentEmojis();
    }

    return this.categorizedEmojis()[activeTab] || [];
  });


  filteredEmojis = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) {
      return [];
    }
    return this.allEmojis().filter(emoji =>
      emoji.name.toLowerCase().includes(term) || emoji.emoji.includes(term) // Basic search
    );
  });


  emojiSelected = output<string>();

  constructor() {
     this.loadRecentEmojis();
     const destroyRef = inject(DestroyRef);
     toObservable(computed(() => this.sectionTabs()))
        .pipe(takeUntilDestroyed(destroyRef))
        .subscribe((tabs:any) => {
            if (!this.activeSectionName() || !tabs.includes(this.activeSectionName()!)) {
                if (tabs.length > 0) {
                    this.activeSectionName.set(tabs[0]);
                } else {
                    this.activeSectionName.set(null);
                }
            }
        });
  }

  ngOnInit(): void {
    this.allEmojis.set(Object.entries(emojiData).map(([emoji, data]) => ({  
      emoji,  
      name: (data as {name: string, group: string}).name,  
      category: (data as {name: string, group: string}).group  
    })));
  }


  setActiveSection(name: string): void {
    this.activeSectionName.set(name);
  }

  selectEmoji(emoji: Emoji): void {
    this.addRecentEmoji(emoji);
    this.emojiSelected.emit(emoji.emoji);
    this.searchTerm.set('');
  }

  private addRecentEmoji(emoji: Emoji): void {
    this.recentEmojis.update(currentRecents => {
      const updatedRecents = currentRecents.filter(r => r.emoji !== emoji.emoji);
      updatedRecents.unshift(emoji);
      return updatedRecents.slice(0, MAX_RECENT_EMOJIS);
    });
    this.saveRecentEmojis();
  }

  private loadRecentEmojis(): void {
    try {
      const recent = localStorage.getItem(RECENT_EMOJIS_STORAGE_KEY);
      if (recent) {
        const emojis = JSON.parse(recent);
        if (Array.isArray(emojis) && emojis.every(item => item.emoji && item.name && item.category)) {
            this.recentEmojis.set(emojis);
        } else {
           console.warn("Invalid data found in localStorage for recent emojis.");
           localStorage.removeItem(RECENT_EMOJIS_STORAGE_KEY);
        }
      }
    } catch (e) {
      console.error('Could not load recent emojis from localStorage', e);
    }
  }

  private saveRecentEmojis(): void {
    try {
      localStorage.setItem(RECENT_EMOJIS_STORAGE_KEY, JSON.stringify(this.recentEmojis()));
    } catch (e) {
      console.error('Could not save recent emojis to localStorage', e);
    }
  }
}