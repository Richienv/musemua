import { format, isToday, isYesterday } from 'date-fns';

export function formatMessageTime(date: string): string {
  return format(new Date(date), 'HH:mm');
}

export function formatMessageDate(date: string): string {
  const messageDate = new Date(date);
  
  if (isToday(messageDate)) {
    return 'Today';
  }
  
  if (isYesterday(messageDate)) {
    return 'Yesterday';
  }
  
  return format(messageDate, 'MMMM d, yyyy');
}

export function formatLastMessageTime(date: string): string {
  const messageDate = new Date(date);
  
  if (isToday(messageDate)) {
    return format(messageDate, 'HH:mm');
  }
  
  if (isYesterday(messageDate)) {
    return 'Yesterday';
  }
  
  return format(messageDate, 'MMM d');
} 