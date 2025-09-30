import { ChatData } from '@/types/chat';

export interface ChatGroup {
  title: string;
  chats: ChatData[];
}

/**
 * Groups chats by date into categories: Today, Yesterday, Previous week, Older
 * @param chats - Array of chat data
 * @returns Array of chat groups with title and chats
 */
export const groupChatsByDate = (chats: ChatData[] | null): ChatGroup[] => {
  if (!chats || chats.length === 0) return [];

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);

  const isSameDay = (date1: Date, date2: Date) =>
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();

  const todayChats: ChatData[] = [];
  const yesterdayChats: ChatData[] = [];
  const previousWeekChats: ChatData[] = [];
  const olderChats: ChatData[] = [];

  chats.forEach(chat => {
    const chatDate = new Date(chat.last_modified || chat.date);

    if (isSameDay(chatDate, today)) {
      todayChats.push(chat);
    } else if (isSameDay(chatDate, yesterday)) {
      yesterdayChats.push(chat);
    } else if (chatDate >= sevenDaysAgo) {
      previousWeekChats.push(chat);
    } else {
      olderChats.push(chat);
    }
  });

  return [
    { title: 'Today', chats: todayChats },
    { title: 'Yesterday', chats: yesterdayChats },
    { title: 'Previous week', chats: previousWeekChats },
    { title: 'Older', chats: olderChats }
  ].filter(group => group.chats.length > 0);
};

