import { GamerHubConfig } from '../types';

export const defaultGamerHub: GamerHubConfig = {
  enabled: true,
  statusText: 'جاهز للعب وسحق الخصوم 🎮🔥',
  isLookingForGroup: true,
  accounts: [
    {
      id: 'valorant',
      game: 'valorant',
      title: 'فالورانت (Valorant)',
      ign: 'SULTAN',
      tagOrCode: '#EGY',
      rank: 'Ascendant / Immortal 👑',
      extraInfo: 'Main: Reyna / Jett ⚡',
      enabled: true
    },
    {
      id: 'steam',
      game: 'steam',
      title: 'ستيم (Steam)',
      ign: '𓆩𝑺𝒖𝒍𝒕𝒂𝒏𓆪',
      tagOrCode: '1184920491',
      rank: 'Steam Level 45 ⭐',
      extraInfo: 'CS2 & Story Games 🎮',
      profileUrl: 'https://steamcommunity.com',
      enabled: true
    },
    {
      id: 'pubg',
      game: 'pubg',
      title: 'ببجي موبايل (PUBG Mobile)',
      ign: 'السلطان',
      tagOrCode: '5198274819',
      rank: 'Conqueror / الغازي 🦅',
      extraInfo: 'KD 5.8 • Ace Dominator 🔥',
      enabled: true
    },
    {
      id: 'discord',
      game: 'discord',
      title: 'ديسكورد جيمنج (Discord)',
      ign: '5susu',
      tagOrCode: '! 𓆩𝑺𝒖𝒍𝒕𝒂𝒏𓆪',
      rank: 'Server Owner 👑',
      extraInfo: 'رومات الألعاب وبطولات السيرفر 💬',
      profileUrl: 'https://discord.gg/TUU6EeC6pb',
      enabled: true
    },
    {
      id: 'epic',
      game: 'epic',
      title: 'إبيك جيمز (Epic Games)',
      ign: 'SultanKing_VIP',
      tagOrCode: '',
      rank: 'Fortnite & Rocket League 🚀',
      extraInfo: 'Battle Pass Max 🏆',
      enabled: true
    }
  ]
};
