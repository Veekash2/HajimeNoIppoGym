export interface Rank {
  level: number;
  name: string;
  character: string;
  xpRequired: number;
  description: string;
  imageUrl: string;
  color: string;
}

export const RANKS: Rank[] = [
  {
    level: 0,
    name: 'Street Kid',
    character: 'Ippo',
    xpRequired: 0,
    description: 'Before the journey began...',
    imageUrl: 'https://wallpapercat.com/w/full/5/e/2/3647-1920x1080-desktop-full-hd-hajime-no-ippo-background.jpg',
    color: '#666666',
  },
  {
    level: 1,
    name: 'Rookie Boxer',
    character: 'Ippo',
    xpRequired: 500,
    description: 'Joined Kamogawa Boxing Gym',
    imageUrl: 'https://wallpapercat.com/w/full/3/d/5/3648-1920x1080-desktop-full-hd-hajime-no-ippo-background.jpg',
    color: '#4488FF',
  },
  {
    level: 2,
    name: 'Regional Contender',
    character: 'Ippo',
    xpRequired: 1500,
    description: 'Fighting your way up',
    imageUrl: 'https://wallpapercat.com/w/full/5/e/2/3647-1920x1080-desktop-full-hd-hajime-no-ippo-background.jpg',
    color: '#44AA44',
  },
  {
    level: 3,
    name: 'Japanese Ranked',
    character: 'Makunouchi',
    xpRequired: 3000,
    description: 'Making your name known',
    imageUrl: 'https://wallpapercat.com/w/full/3/d/5/3648-1920x1080-desktop-full-hd-hajime-no-ippo-background.jpg',
    color: '#AAAA44',
  },
  {
    level: 4,
    name: 'Class A Boxer',
    character: 'Sendo',
    xpRequired: 6000,
    description: 'Rival of champions',
    imageUrl: 'https://wallpapercave.com/wp/wp8613046.jpg',
    color: '#FF8800',
  },
  {
    level: 5,
    name: 'Japanese Champion',
    character: 'Champion Ippo',
    xpRequired: 10000,
    description: 'The Dempsey Roll — unstoppable',
    imageUrl: 'https://wallpapercat.com/w/full/5/e/2/3647-1920x1080-desktop-full-hd-hajime-no-ippo-background.jpg',
    color: '#CC0000',
  },
  {
    level: 6,
    name: 'Asian Champion',
    character: 'Takamura',
    xpRequired: 15000,
    description: 'Reaching for the world stage',
    imageUrl: 'https://wallpapercave.com/wp/wp8613046.jpg',
    color: '#FF4444',
  },
  {
    level: 7,
    name: 'World Contender',
    character: 'Takamura',
    xpRequired: 22000,
    description: 'The bear of Kamogawa',
    imageUrl: 'https://wallpapercave.com/wp/wp8613046.jpg',
    color: '#FFD700',
  },
  {
    level: 8,
    name: 'WORLD CHAMPION',
    character: 'Takamura',
    xpRequired: 30000,
    description: 'Champion of champions. Peak human.',
    imageUrl: 'https://wallpapercave.com/wp/wp8613046.jpg',
    color: '#FFD700',
  },
];

export function getRankForXP(xp: number): Rank {
  let currentRank = RANKS[0];
  for (const rank of RANKS) {
    if (xp >= rank.xpRequired) {
      currentRank = rank;
    }
  }
  return currentRank;
}

export function getNextRank(xp: number): Rank | null {
  const current = getRankForXP(xp);
  const nextIndex = RANKS.findIndex(r => r.level === current.level) + 1;
  return RANKS[nextIndex] || null;
}

export function getXPProgress(xp: number): number {
  const current = getRankForXP(xp);
  const next = getNextRank(xp);
  if (!next) return 1;
  const rangeXP = next.xpRequired - current.xpRequired;
  const earnedXP = xp - current.xpRequired;
  return earnedXP / rangeXP;
}
