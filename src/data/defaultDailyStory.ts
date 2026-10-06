import { DailyStory, DiscordRadarConfig } from '../types';

export const defaultDailyStory: DailyStory = {
  enabled: true,
  text: 'اليوم تركيز عالي في الجيم 🦾 + مذاكرة فيزياء 📖.. ومساءً سهرة رايقة فالورانت وديسكورد مع الشباب! 🔥',
  moodEmoji: '🦾',
  category: 'يوميات وبطولات السلطان',
  createdAt: 'اليوم • نشط الآن',
  likesCount: 142,
  reactions: {
    '🔥': 78,
    '👑': 64,
    '🦾': 52,
    '❤️': 45
  }
};

export const defaultDiscordRadar: DiscordRadarConfig = {
  enabled: true,
  customStatusText: '! 𓆩𝑺𝒖𝒍𝒕𝒂𝒏𓆪 | 5susu',
  customStatusEmoji: '👑',
  voiceChannelName: 'الروم الملكي 👑',
  allowDirectMessage: true
};
