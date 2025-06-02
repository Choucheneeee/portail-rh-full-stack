import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, OnDestroy, AfterViewChecked, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SocketService } from '../../service/socket.service';
import { ServiceRHService } from '../service-rh.service';
import { Subscription, Observable } from 'rxjs'; // Added Observable import
import { ChatService } from '../../services/chat.service';
import { UserService, User } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

interface ExtendedUser extends User {
  email?: string;
  lastSeen?: Date;
}

interface Message {
  _id?: string;
  text: string;
  senderId: string;
  receiverId: string;
  timestamp: Date;
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule, MatSnackBarModule],  // Add MatSnackBarModule here
  providers: [ChatService]
})
export class ChatComponent implements AfterViewChecked {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;
  currentUserId = '';
  messages: Message[] = [];
  users: ExtendedUser[] = [];
  messageText = '';
  searchTerm = '';
  selectedUser: ExtendedUser | null = null;
  isSending = false;

  private userSubscription!: Subscription;
  private socketSubscriptions = new Subscription();
  private onlineStatusSub!: Subscription;
  private messagesSub!: Subscription;

  constructor(
    private socket: SocketService,
    private share: ServiceRHService,
    private chatService: ChatService,
    private userService: UserService,
    private authService: AuthService,
    private _snackBar: MatSnackBar  // Add this line
  ) {
    const currentUser = this.authService.getCurrentUser();
    this.currentUserId = currentUser?._id || '';
  }

  ngOnInit(): void {
    this.fetchUsers();
    this.initializeSocketListeners();
    this.setupOnlineStatus();
    this.loadUsers();
    // Remove this line as it's creating duplicate connection
    // this.setupWebSocket();
  }

  // Remove this method as we're already handling messages in initializeSocketListeners
  // private setupWebSocket(): void { ... }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  printMessageDebugInfo() {
  }
  private setupOnlineStatus(): void {
    // Request initial online status
    this.socket.requestOnlineUsers();
    
    // Listen for online users updates
    this.onlineStatusSub = this.socket.getOnlineUsers().subscribe((onlineIds: string[]) => {
      this.users = this.users.map(user => ({
        ...user,
        online: Array.isArray(onlineIds) && onlineIds.includes(user._id)
      }));
    });
  }

  private audio = new Audio('assets/audio/sound.mp3');

  showNotification = false;
  notificationMessage = '';

  // Add this method to play sound and show notification
  

  private getUserName(userId: string): string {
    const user = this.users.find(u => u._id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
  }

  // Update the initializeSocketListeners method
  private initializeSocketListeners(): void {
    this.socketSubscriptions.add(
      this.socket.onMessage().subscribe({
        next: (message) => {
          const newMessage: Message = {
            text: message.message,
            senderId: message.senderId,
            receiverId: this.currentUserId,
            timestamp: new Date(message.timestamp),
          };

          // Only add message if it's relevant to current chat
          if (this.selectedUser && 
              (message.senderId === this.selectedUser._id || 
               message.senderId === this.currentUserId)) {
            this.messages = [...this.messages, newMessage];
            this.scrollToBottom();
                      }
        },
        error: (err) => console.error('Message error:', err)
      })
    );
  }


selectUser(user: ExtendedUser): void {
  if (this.messagesSub) {
    this.messagesSub.unsubscribe();
  }

  this.selectedUser = user;
  this.messages = []; // Clear messages before loading new ones

  // Reset unread count for selected user
  this.users = this.users.map(u => 
    u._id === user._id ? { ...u, unread: 0 } : u
  );

  // Fetch messages for the selected user
  this.messagesSub = this.share.getMessages(user._id).subscribe({
    next: (response: any) => {
      if (this.selectedUser?._id !== user._id) return; // Prevent race condition

      this.messages = response.map((msg: any) => ({
        _id: msg._id,
        text: msg.content,
        senderId: msg.sender._id,
        receiverId: msg.receiver._id,
        timestamp: new Date(msg.timestamp)
      }));
      
      // Sort messages by timestamp
      this.messages.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      this.scrollToBottom();
    },
    error: (error) => {
      console.error('Error fetching messages:', error);
    }
  });
}

get filteredMessages(): Message[] {
  if (!this.selectedUser || !this.currentUserId) return [];
  
  return this.messages.filter(message => 
    (message.senderId === this.currentUserId && 
     message.receiverId === this.selectedUser!._id) ||
    (message.receiverId === this.currentUserId && 
     message.senderId === this.selectedUser!._id)
  );
}

  fetchUsers(): void {
    this.userSubscription = this.share.getUsersChat().subscribe({
      next: (data: any) => {
        console.log("data", data);
        this.users = [
          ...data.collaborator.map((u: any) => this.mapUser(u)),
          ...data.rh.map((u: any) => this.mapUser(u))

          
        ];
        console.log("first",this.users)
        this.socket.requestOnlineUsers();

      },
      error: (error: any) => console.error(error)
    });
  }

  private mapUser(user: any): ExtendedUser {
    return {
      _id: user._id,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      online: false,
      unread: 0,
      role:user.role,
      lastSeen: new Date()
    };
  }

  ngOnDestroy(): void {
    this.socketSubscriptions.unsubscribe();
    this.onlineStatusSub?.unsubscribe();
    this.messagesSub?.unsubscribe();
    this.selectedUser = null;
    this.messages = [];
    this.searchTerm = '';
    this.users = [];
    this.currentUserId = '';
    this.messageText = '';
    this.displayedUsersCount = 5;
    this.prevSearchTerm = '';
    this.isSending = false;

    
  }

  // MSG
  displayedUsersCount = 10;
  private scrollDebounceTime = 200;
  prevSearchTerm = '';
  get filteredUsers(): ExtendedUser[] {
    const term = this.searchTerm.toLowerCase();
    const filtered = this.users.filter(user => 
      user.firstName.toLowerCase().includes(term) ||
      user.lastName.toLowerCase().includes(term)
    );
    
    // Reset displayed count when search changes
    if (this.prevSearchTerm !== term) {
      this.displayedUsersCount = 5;
      this.prevSearchTerm = term;
    }
    return filtered;
  }
  get showLoadMore(): boolean {
    return this.filteredUsers.length > this.displayedUsersCount;
  }

  onScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const atBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
    
    if (atBottom) {
      this.loadMoreUsers();
    }
  }

  loadMoreUsers(): void {
    const remainingUsers = this.filteredUsers.length - this.displayedUsersCount;
    this.displayedUsersCount += Math.min(5, remainingUsers);
  }

  

  sendMessage(): void {
    if (!this.messageText.trim() || !this.selectedUser) return;
    
    if (!this.currentUserId) {
      console.error('No valid sender ID found');
      return;
    }

    const messageContent = this.messageText.trim(); // Store message content
    const messageToSend = {
      content: messageContent,
      sender: this.currentUserId,
      receiver: this.selectedUser._id,
      timestamp: new Date(),
    };
  
    // Send message through socket
    this.socket.sendMessage(this.selectedUser._id, messageContent);
    
    // Update UI immediately
    this.messages = [...this.messages, {
      text: messageContent,
      senderId: this.currentUserId,
      receiverId: this.selectedUser._id,
      timestamp: new Date(),
    }];
    
    // Clear input
    this.messageText = '';
    this.scrollToBottom();
    
    // Send to backend
    this.share.sendMessage(messageToSend).subscribe({
      next: () => {
        // Emit notification with stored message content
        const mes=`New message from ${this.getUserName(this.currentUserId)}: ${messageContent.substring(0, 50)}${messageContent.length > 50 ? '...' : ''}`
        this.socket.emit('notif', {
          type: 'new_message',
          targetUserId: this.selectedUser!._id,
          message:mes ,
          timestamp: new Date().toISOString()
        });
        console.log('Message sent successfully');
        const sub = this.share.sentnotif(mes, this.selectedUser!._id).subscribe();

      },
      error: (err) => {
        console.error('Message error:', err);
        this.messages = this.messages.slice(0, -1);
      }
    });
}

  private scrollToBottom(): void {
    try {
      setTimeout(() => {
        if (this.messageContainer) {
          this.messageContainer.nativeElement.scrollTop = 
            this.messageContainer.nativeElement.scrollHeight;
        }
      }, 100);
    } catch(err) { }
  }

  handleKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
  
  private loadUsers(): void {
    this.userService.getUsers().subscribe((users: ExtendedUser[]) => {
      this.users = users.filter(user => user._id !== this.currentUserId);
      this.loadUnreadCounts();
    }, (error: Error) => {
      console.error('Error loading users:', error);
    });
  }

  private loadUnreadCounts(): void {
    this.chatService.getUnreadCounts().subscribe((counts: { [key: string]: number }) => {
      this.users.forEach(user => {
        user.unread = counts[user._id] || 0;
      });
    }, (error: Error) => {
      console.error('Error loading unread counts:', error);
    });
  }

  private setupWebSocket(): void {
    this.chatService.connect().subscribe((message: Message) => {
      if (message.senderId === this.selectedUser?._id) {
        this.messages.push(message);
        this.scrollToBottom();
      } else {
        const user = this.users.find(u => u._id === message.senderId);
        if (user) {
          user.unread = (user.unread || 0) + 1;
        }
      }
    }, (error: Error) => {
      console.error('WebSocket error:', error);
    });
  }

  selectUserChat(user: ExtendedUser): void {
    this.selectedUser = user;
    this.loadMessages(user._id);
    if (user.unread) {
      this.markMessagesAsRead(user._id);
    }
  }

  private loadMessages(userId: string): void {
    this.chatService.getMessages(userId).subscribe(
      (messages: Message[]) => {
        this.messages = messages;
        this.scrollToBottom();
      },
      error => console.error('Error loading messages:', error)
    );
  }

  private markMessagesAsRead(userId: string): void {
    this.chatService.markMessagesAsRead(userId).subscribe({
      next: () => {
        const user = this.users.find(u => u._id === userId);
        if (user) {
          user.unread = 0;
        }
      },
      error: (error: Error) => console.error('Error marking messages as read:', error)
    });
  }
  
  deleteMessage(message: Message): void {
    if (!message._id) {
      console.error('Message ID not found');
      return;
    }

    // Remove message from UI immediately
    this.messages = this.messages.filter(m => m._id !== message._id);

    // Call backend to delete the message
    this.share.deleteMessage(message._id).subscribe({
      next: () => {
        // Show success notification
        this.notificationMessage = 'Message deleted successfully';
        this.showNotification = true;
        setTimeout(() => this.showNotification = false, 3000);
      },
      error: (error) => {
        // Revert the UI change if deletion fails
        this.messages.push(message);
        this.messages.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        // Show error notification
        this._snackBar.open('Error deleting message', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        console.error('Error deleting message:', error);
      }
    });
  }
 
}