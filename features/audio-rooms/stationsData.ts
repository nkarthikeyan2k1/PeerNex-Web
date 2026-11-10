export interface Station {
  id: string;
  name: string;
  region: 'South';
  state: string;
  city: string;
  desc: string;
  speakerNote: string;
  defaultParticipants: { name: string; initial: string; color: string }[];
  maxCapacity: number;
}

export const STATIONS: Station[] = [
  {
    id: 'chennai_central',
    name: 'Chennai Central',
    region: 'South',
    state: 'Tamil Nadu',
    city: 'Chennai',
    desc: 'The vibrant capital junction. Filter coffee, tech talk, and late-night banter.',
    speakerNote: 'Active discussions',
    defaultParticipants: [
      { name: 'Arjun', initial: 'A', color: '#0ea5e9' },
      { name: 'Pooja', initial: 'P', color: '#f59e0b' },
      { name: 'Dev', initial: 'D', color: '#10b981' },
    ],
    maxCapacity: 6,
  },
  {
    id: 'coimbatore_junction',
    name: 'Coimbatore Junction',
    region: 'South',
    state: 'Tamil Nadu',
    city: 'Coimbatore',
    desc: 'The textile hub and gateway to the hills. Chill weekend vibes and friendly conversations.',
    speakerNote: 'Open mic',
    defaultParticipants: [
      { name: 'Noah', initial: 'N', color: '#f59e0b' },
      { name: 'Esha', initial: 'E', color: '#06b6d4' },
      { name: 'Jay', initial: 'J', color: '#8b5cf6' },
    ],
    maxCapacity: 6,
  },
  {
    id: 'bengaluru_city',
    name: 'Bengaluru City',
    region: 'South',
    state: 'Karnataka',
    city: 'Bengaluru',
    desc: 'Startups, engineering, weather, and traffic stories. Pull up a chair and join in.',
    speakerNote: 'Tech & chill',
    defaultParticipants: [
      { name: 'Chloe', initial: 'C', color: '#14b8a6' },
      { name: 'Aarav', initial: 'A', color: '#f43f5e' },
      { name: 'Sneha', initial: 'S', color: '#eab308' },
    ],
    maxCapacity: 6,
  },
];
