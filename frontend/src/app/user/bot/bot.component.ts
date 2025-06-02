import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EmployeServiceService } from '../../service/employe-service.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface ChatMessage {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface FormattedLine {
  type: 'header' | 'divider' | 'code' | 'list' | 'text';
  content?: string;
  items?: string[];
  isBold?: boolean;
}

interface QuickReply {
  text: string;
  value: string;
}

@Component({
  selector: 'app-bot',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
  ],
  templateUrl: './bot.component.html',
  styleUrl: './bot.component.css'
})
export class BotComponent {
  isChatOpen = false;
  messages: ChatMessage[] = [];
  newMessage = '';
  isTyping = false;

  // Add conversation history
  private conversationHistory: Array<{ role: string, content: string }> = [];

  quickReplies: QuickReply[] = [
    {
      text: "Comment demander une attestation de travail ?",
      value: "Je voudrais savoir la procédure pour obtenir une attestation de travail."
    },
    {
      text: "Demander des congés",
      value: "Quelle est la procédure pour demander des congés ?"
    },
    {
      text: "Consulter mes fiches de paie",
      value: "Comment puis-je consulter mes fiches de paie ?"
    },
    {
      text: "Support technique",
      value: "J'ai besoin d'aide technique."
    }
  ];

  constructor(
    private share: EmployeServiceService,
    private sanitizer: DomSanitizer
  ) {
    // Add default welcome message
    this.addWelcomeMessage();
  }

  private addWelcomeMessage(): void {
    const welcomeMessage = `👋 **Bienvenue!** Je suis votre assistant IA. Je peux vous aider avec:

### Services Disponibles:
- Informations sur les politiques de l'entreprise
- Assistance pour les demandes de documents
- Questions RH générales
- Support technique
- Et plus encore!

### NB:
- **Tous les messages ne seront pas sauvegardés** après la fermeture du chat
- Vos conversations resteront confidentielles

N'hésitez pas à me poser vos questions! 😊`;

    // Add welcome message to conversation history
    this.conversationHistory.push({ 
      role: "assistant",
      content: welcomeMessage 
    });

    // Add welcome message to UI
    this.messages.push({
      text: welcomeMessage,
      isUser: false,
      timestamp: new Date()
    });
  }

  toggleChat(): void {
    this.isChatOpen = !this.isChatOpen;
    
    // If chat is being opened and no messages exist, add welcome message
    if (this.isChatOpen && this.messages.length === 0) {
      this.addWelcomeMessage();
    }
  }

  async sendMessage(): Promise<void> {
    if (this.newMessage.trim()) {
      // Add user message to UI
      this.messages.push({
        text: this.newMessage,
        isUser: true,
        timestamp: new Date()
      });

      const userMessage = this.newMessage;
      this.newMessage = ''; // Clear input
      this.isTyping = true;

      // Add user message to conversation history
      this.conversationHistory.push({ role: "user", content: userMessage });

      try {
        // Format message for API including conversation history
        const messagePayload = {
          messages: this.conversationHistory
        };

        // Send message to bot API
        this.share.sendbotMessage(messagePayload).subscribe({
          next: (response) => {
            console.log("response", response);
            
            // Add bot response to conversation history
            this.conversationHistory.push({ 
              role: "system", 
              content: response.response || "Sorry, I don't understand."
            });

            // Add bot response to UI
            this.messages.push({
              text: response.response || "Sorry, I don't understand.",
              isUser: false,
              timestamp: new Date()
            });
          },
          error: (error) => {
            console.error('Error getting bot response:', error);
            this.messages.push({
              text: 'Sorry, I encountered an error. Please try again.',
              isUser: false,
              timestamp: new Date()
            });
          },
          complete: () => {
            this.isTyping = false;
          }
        });

      } catch (error) {
        console.error('Error sending message:', error);
        this.messages.push({
          text: 'Sorry, I encountered an error. Please try again.',
          isUser: false,
          timestamp: new Date()
        });
        this.isTyping = false;
      }
    }
  }

  // Remove or comment out the simulateBotResponse method since we're using the actual API now
  // private async simulateBotResponse(userMessage: string): Promise<void> { ... }

  selectQuickReply(reply: QuickReply): void {
    this.newMessage = reply.value;
    this.sendMessage();
  }

  formatMessage(text: string): FormattedLine[] {
    const lines = text.split('\n');
    const formatted: FormattedLine[] = [];
    let inCodeBlock = false;
    let codeContent = '';

    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // Handle code blocks
      if (trimmedLine.startsWith('```')) {
        if (inCodeBlock) {
          formatted.push({ type: 'code', content: codeContent.trim() });
          codeContent = '';
        }
        inCodeBlock = !inCodeBlock;
        return;
      }
      
      if (inCodeBlock) {
        codeContent += line + '\n';
        return;
      }

      // Handle headers
      if (trimmedLine.startsWith('###')) {
        formatted.push({ 
          type: 'header', 
          content: this.processBoldText(trimmedLine.replace('###', '').trim())
        });
        return;
      }

      // Handle dividers
      if (trimmedLine === '---') {
        formatted.push({ type: 'divider' });
        return;
      }

      // Handle list items
      if (trimmedLine.startsWith('- ')) {
        const lastItem = formatted[formatted.length - 1];
        if (lastItem && lastItem.type === 'list') {
          lastItem.items?.push(this.processBoldText(trimmedLine.substring(2)));
        } else {
          formatted.push({ 
            type: 'list', 
            items: [this.processBoldText(trimmedLine.substring(2))] 
          });
        }
        return;
      }

      // Regular text
      if (trimmedLine) {
        formatted.push({ 
          type: 'text', 
          content: this.processBoldText(trimmedLine)
        });
      }
    });

    return formatted;
  }

  private processBoldText(text: string): string {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }
}
