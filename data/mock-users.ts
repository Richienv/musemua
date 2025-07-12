// Mock data to replace Supabase for easier UI development
// Based on the new card design: name on top, full image, gradient blur, side button

export interface MockUser {
  id: number;
  firstName: string;
  lastName: string;
  displayName: string;
  status: 'online' | 'offline' | 'connecting' | 'available' | 'busy';
  imageUrl: string;
  expertise: string; // e.g., "Expert MUA", "Trainee MUSE", "Certified MUA"
  location: string;
  clientsReached: number; // Number of clients who reached out
  projectsCompleted: number; // Number that converted to projects
  instagramFollowers: string; // e.g., "12K", "45K", "120K"
  isAvailable: boolean;
  lastActive: string;
  // Face characteristics for MUSE profiles
  characteristics?: {
    height: string;
    bust: string;
    waist: string;
    hips: string;
    shoes: string;
    suit: string;
    hairColor: string;
    eyeColor: string;
    ethnicity: string;
    eyeType: string;
    noseType: string;
    lipType: string;
    browType: string;
    eyelidType: string;
  };
}

export const mockUsers: MockUser[] = [
  {
    id: 1,
    firstName: "Sari",
    lastName: "Dewi", 
    displayName: "Sari Dewi",
    status: "connecting",
    imageUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b272?w=400&h=600&fit=crop&crop=face",
    expertise: "MUA Ahli",
    location: "Jakarta",
    clientsReached: 142,
    projectsCompleted: 89,
    instagramFollowers: "45K",
    isAvailable: true,
    lastActive: "2 menit yang lalu",
    characteristics: {
      height: "168",
      bust: "101",
      waist: "82",
      hips: "99",
      shoes: "39",
      suit: "52",
      hairColor: "BROWN",
      eyeColor: "BROWN",
      ethnicity: "Asian",
      eyeType: "Almond",
      noseType: "Straight",
      lipType: "Full",
      browType: "Arched",
      eyelidType: "Double"
    }
  },
  {
    id: 2,
    firstName: "Putri",
    lastName: "Lestari",
    displayName: "Putri Lestari",
    status: "online",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop&crop=face", 
    expertise: "MUA Bersertifikat",
    location: "Bandung",
    clientsReached: 78,
    projectsCompleted: 52,
    instagramFollowers: "23K",
    isAvailable: true,
    lastActive: "Baru saja",
    characteristics: {
      height: "165",
      bust: "96",
      waist: "76",
      hips: "94",
      shoes: "37",
      suit: "48",
      hairColor: "BLACK",
      eyeColor: "DARK BROWN",
      ethnicity: "Asian",
      eyeType: "Round",
      noseType: "Button",
      lipType: "Medium",
      browType: "Straight",
      eyelidType: "Mono"
    }
  },
  {
    id: 3,
    firstName: "Maya",
    lastName: "Sari",
    displayName: "Maya Sari",
    status: "available",
    imageUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop&crop=face",
    expertise: "MUA Profesional",
    location: "Surabaya",
    clientsReached: 34,
    projectsCompleted: 18,
    instagramFollowers: "12K",
    isAvailable: true,
    lastActive: "5 menit yang lalu",
    characteristics: {
      height: "172",
      bust: "89",
      waist: "68",
      hips: "92",
      shoes: "38",
      suit: "50",
      hairColor: "BLONDE",
      eyeColor: "HAZEL",
      ethnicity: "Mixed",
      eyeType: "Hooded",
      noseType: "Aquiline",
      lipType: "Thin",
      browType: "Arched",
      eyelidType: "Double"
    }
  },
  {
    id: 4,
    firstName: "Luna",
    lastName: "Pratiwi",
    displayName: "Luna Pratiwi",
    status: "busy",
    imageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop&crop=face",
    expertise: "Spesialis Kecantikan Senior",
    location: "Yogyakarta",
    clientsReached: 156,
    projectsCompleted: 112,
    instagramFollowers: "78K",
    isAvailable: false,
    lastActive: "1 jam yang lalu",
    characteristics: {
      height: "170",
      bust: "93",
      waist: "71",
      hips: "96",
      shoes: "39",
      suit: "52",
      hairColor: "DARK BROWN",
      eyeColor: "GREEN",
      ethnicity: "Asian",
      eyeType: "Cat",
      noseType: "Roman",
      lipType: "Heart-shaped",
      browType: "Angular",
      eyelidType: "Mono"
    }
  },
  {
    id: 5,
    firstName: "Intan",
    lastName: "Permata",
    displayName: "Intan Permata", 
    status: "online",
    imageUrl: "https://images.unsplash.com/photo-1488207984690-078bdd7cb0dd?w=400&h=600&fit=crop&crop=face",
    expertise: "Direktur Kreatif",
    location: "Bali",
    clientsReached: 203,
    projectsCompleted: 145,
    instagramFollowers: "120K",
    isAvailable: true,
    lastActive: "Baru saja",
    characteristics: {
      height: "175",
      bust: "85",
      waist: "63",
      hips: "88",
      shoes: "40",
      suit: "48",
      hairColor: "AUBURN",
      eyeColor: "BLUE",
      ethnicity: "Caucasian",
      eyeType: "Deep-set",
      noseType: "Upturned",
      lipType: "Bow",
      browType: "Thick",
      eyelidType: "Double"
    }
  },
  {
    id: 6,
    firstName: "Zahra",
    lastName: "Amelia",
    displayName: "Zahra Amelia",
    status: "connecting",
    imageUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=600&fit=crop&crop=face",
    expertise: "Konsultan Kecantikan",
    location: "Medan",
    clientsReached: 98,
    projectsCompleted: 67,
    instagramFollowers: "34K",
    isAvailable: true,
    lastActive: "3 menit yang lalu",
    characteristics: {
      height: "166",
      bust: "92",
      waist: "70",
      hips: "95",
      shoes: "38",
      suit: "50",
      hairColor: "BLACK",
      eyeColor: "BROWN",
      ethnicity: "Asian",
      eyeType: "Round",
      noseType: "Button",
      lipType: "Medium",
      browType: "Straight",
      eyelidType: "Mono"
    }
  },
  {
    id: 7,
    firstName: "Citra",
    lastName: "Wulandari",
    displayName: "Citra Wulandari",
    status: "offline",
    imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop&crop=face",
    expertise: "Stylist Kecantikan Ahli",
    location: "Semarang",
    clientsReached: 87,
    projectsCompleted: 63,
    instagramFollowers: "29K",
    isAvailable: false,
    lastActive: "2 jam yang lalu",
    characteristics: {
      height: "173",
      bust: "87",
      waist: "65",
      hips: "90",
      shoes: "39",
      suit: "50",
      hairColor: "BROWN",
      eyeColor: "HAZEL",
      ethnicity: "Asian",
      eyeType: "Almond",
      noseType: "Straight",
      lipType: "Full",
      browType: "Arched",
      eyelidType: "Double"
    }
  },
  {
    id: 8,
    firstName: "Rina",
    lastName: "Safitri",
    displayName: "Rina Safitri",
    status: "available",
    imageUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=600&fit=crop&crop=face",
    expertise: "MUA Bersertifikat",
    location: "Malang",
    clientsReached: 123,
    projectsCompleted: 94,
    instagramFollowers: "56K",
    isAvailable: true,
    lastActive: "10 menit yang lalu",
    characteristics: {
      height: "169",
      bust: "90",
      waist: "67",
      hips: "93",
      shoes: "39",
      suit: "52",
      hairColor: "DARK BROWN",
      eyeColor: "BLACK",
      ethnicity: "Asian",
      eyeType: "Cat",
      noseType: "Aquiline",
      lipType: "Heart-shaped",
      browType: "Angular",
      eyelidType: "Double"
    }
  },
  {
    id: 9,
    firstName: "Olivia",
    lastName: "Maharani",
    displayName: "Olivia Maharani",
    status: "online",
    imageUrl: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=400&h=600&fit=crop&crop=face",
    expertise: "Direktur Seni",
    location: "Makassar",
    clientsReached: 176,
    projectsCompleted: 128,
    instagramFollowers: "89K",
    isAvailable: true,
    lastActive: "Baru saja",
    characteristics: {
      height: "171",
      bust: "86",
      waist: "64",
      hips: "89",
      shoes: "40",
      suit: "48",
      hairColor: "BLONDE",
      eyeColor: "BLUE",
      ethnicity: "Mixed",
      eyeType: "Deep-set",
      noseType: "Upturned",
      lipType: "Bow",
      browType: "Thick",
      eyelidType: "Double"
    }
  },
  {
    id: 10,
    firstName: "Ava",
    lastName: "Kusuma", 
    displayName: "Ava Kusuma",
    status: "connecting",
    imageUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=600&fit=crop&crop=face",
    expertise: "MUA Pemula",
    location: "Palembang",
    clientsReached: 45,
    projectsCompleted: 23,
    instagramFollowers: "8K",
    isAvailable: true,
    lastActive: "1 menit yang lalu",
    characteristics: {
      height: "164",
      bust: "88",
      waist: "69",
      hips: "92",
      shoes: "37",
      suit: "48",
      hairColor: "BROWN",
      eyeColor: "HAZEL",
      ethnicity: "Asian",
      eyeType: "Hooded",
      noseType: "Roman",
      lipType: "Thin",
      browType: "Feathered",
      eyelidType: "Mono"
    }
  },
  {
    id: 11,
    firstName: "Grace",
    lastName: "Indira",
    displayName: "Grace Indira",
    status: "available",
    imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop&crop=face",
    expertise: "Spesialis Fotografi",
    location: "Denpasar",
    clientsReached: 134,
    projectsCompleted: 98,
    instagramFollowers: "67K",
    isAvailable: true,
    lastActive: "15 menit yang lalu",
    characteristics: {
      height: "168",
      bust: "88",
      waist: "66",
      hips: "91",
      shoes: "38",
      suit: "50",
      hairColor: "RED",
      eyeColor: "AMBER",
      ethnicity: "Mixed",
      eyeType: "Downturned",
      noseType: "Greek",
      lipType: "Wide",
      browType: "Feathered",
      eyelidType: "Double"
    }
  },
  {
    id: 12,
    firstName: "Mia",
    lastName: "Kartika",
    displayName: "Mia Kartika",
    status: "busy",
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=600&fit=crop&crop=face",
    expertise: "Ahli Kecantikan Kreatif",
    location: "Batam",
    clientsReached: 89,
    projectsCompleted: 56,
    instagramFollowers: "31K",
    isAvailable: false,
    lastActive: "30 menit yang lalu",
    characteristics: {
      height: "167",
      bust: "91",
      waist: "68",
      hips: "94",
      shoes: "38",
      suit: "50",
      hairColor: "RED",
      eyeColor: "GREEN",
      ethnicity: "Mixed",
      eyeType: "Downturned",
      noseType: "Greek",
      lipType: "Wide",
      browType: "Arched",
      eyelidType: "Double"
    }
  }
];

// Helper functions for working with mock data
export const getUserById = (id: number): MockUser | undefined => {
  return mockUsers.find(user => user.id === id);
};

export const getUsersByExpertise = (expertise: string): MockUser[] => {
  return mockUsers.filter(user => 
    user.expertise.toLowerCase().includes(expertise.toLowerCase())
  );
};

export const getUsersByStatus = (status: MockUser['status']): MockUser[] => {
  return mockUsers.filter(user => user.status === status);
};

export const getAvailableUsers = (): MockUser[] => {
  return mockUsers.filter(user => user.isAvailable);
};

export const searchUsers = (query: string): MockUser[] => {
  const lowercaseQuery = query.toLowerCase();
  return mockUsers.filter(user => 
    user.displayName.toLowerCase().includes(lowercaseQuery) ||
    user.expertise.toLowerCase().includes(lowercaseQuery) ||
    user.location.toLowerCase().includes(lowercaseQuery)
  );
};

export const getConversionRate = (user: MockUser): number => {
  if (user.clientsReached === 0) return 0;
  return Math.round((user.projectsCompleted / user.clientsReached) * 100);
};

// Simplified expertise categories - Only MUA and MUSE
export const expertiseTypes = [
  "MUA", "MUSE"
];

// Price ranges for filtering
export const priceRanges = [
  "Semua Harga",
  "Di bawah 200k",
  "200k - 500k", 
  "500k - 1jt",
  "Di atas 1jt"
];

// Level categories for filtering  
export const levelTypes = [
  "Semua Level",
  "Pemula",
  "Menengah", 
  "Ahli",
  "Profesional"
];

// Location categories for filtering
export const locationTypes = [
  "Semua Lokasi",
  "Jakarta",
  "Bandung",
  "Surabaya", 
  "Yogyakarta",
  "Bali",
  "Medan",
  "Semarang",
  "Malang",
  "Makassar",
  "Palembang",
  "Denpasar",
  "Batam"
];

// Status colors for UI
export const getStatusColor = (status: MockUser['status']): string => {
  switch (status) {
    case 'online': return 'bg-green-500';
    case 'connecting': return 'bg-blue-500';
    case 'available': return 'bg-green-400';
    case 'busy': return 'bg-yellow-500';
    case 'offline': return 'bg-gray-400';
    default: return 'bg-gray-400';
  }
};

export const getStatusText = (status: MockUser['status']): string => {
  switch (status) {
    case 'online': return 'Online';
    case 'connecting': return 'Menghubungkan';
    case 'available': return 'Tersedia';
    case 'busy': return 'Sibuk';
    case 'offline': return 'Offline';
    default: return 'Tidak Diketahui';
  }
};

// Helper function to get user price range based on expertise
export const getUserPriceRange = (user: MockUser): string => {
  const expertise = user.expertise;
  if (expertise.includes('Ahli') || expertise.includes('Direktur')) {
    return 'Di atas 1jt';
  } else if (expertise.includes('Profesional') || expertise.includes('Senior')) {
    return '500k - 1jt';
  } else if (expertise.includes('Bersertifikat') || expertise.includes('Spesialis')) {
    return '200k - 500k';
  } else {
    return 'Di bawah 200k';
  }
};

// Helper function to get user level based on expertise
export const getUserLevel = (user: MockUser): string => {
  const expertise = user.expertise;
  if (expertise.includes('Ahli') || expertise.includes('Direktur')) {
    return 'Ahli';
  } else if (expertise.includes('Profesional') || expertise.includes('Senior')) {
    return 'Profesional';
  } else if (expertise.includes('Bersertifikat') || expertise.includes('Spesialis')) {
    return 'Menengah';
  } else {
    return 'Pemula';
  }
};

// Helper function to get user category (MUA or MUSE)
export const getUserCategory = (user: MockUser): string => {
  if (user.expertise.includes('MUA')) {
    return 'MUA';
  } else if (user.characteristics) {
    return 'MUSE';
  } else {
    return 'MUA'; // Default to MUA if no characteristics (assuming MUA)
  }
};

// Filter users by multiple criteria
export const filterUsers = (filters: {
  expertise?: string;
  priceRange?: string;
  level?: string;
  location?: string;
  searchQuery?: string;
}): MockUser[] => {
  return mockUsers.filter(user => {
    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesSearch = 
        user.displayName.toLowerCase().includes(query) ||
        user.expertise.toLowerCase().includes(query) ||
        user.location.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Expertise filter - now using MUA/MUSE categories
    if (filters.expertise && filters.expertise !== 'Semua Expertise') {
      if (getUserCategory(user) !== filters.expertise) return false;
    }

    // Price range filter  
    if (filters.priceRange && filters.priceRange !== 'Semua Harga') {
      if (getUserPriceRange(user) !== filters.priceRange) return false;
    }

    // Level filter
    if (filters.level && filters.level !== 'Semua Level') {
      if (getUserLevel(user) !== filters.level) return false;
    }

    // Location filter
    if (filters.location && filters.location !== 'Semua Lokasi') {
      if (user.location !== filters.location) return false;
    }

    return true;
  });
};