// Mock data for collaboration requests
export interface CollaborationRequest {
  id: string;
  clientId: string;
  muaId: number;
  projectType: string;
  budgetRange: string;
  customBudget?: string;
  timeline: string;
  urgency: 'normal' | 'urgent' | 'flexible';
  description: string;
  requirements: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientCompany?: string;
  status: 'pending' | 'accepted' | 'declined' | 'counter_offered' | 'in_progress' | 'completed';
  createdAt: string;
  updatedAt: string;
  responseDeadline: string;
  clientAvatar?: string;
}

export const mockCollaborationRequests: CollaborationRequest[] = [
  {
    id: "req_001",
    clientId: "client_001",
    muaId: 1, // Sari Dewi
    projectType: "Fashion Show",
    budgetRange: "Rp 5,000,000 - Rp 10,000,000",
    timeline: "2-4 weeks",
    urgency: "urgent",
    description: "Looking for a professional MUA for our upcoming fashion show featuring sustainable fashion brands. We need someone who can create bold, editorial looks that complement our eco-friendly theme. The show will be photographed extensively for our marketing campaign.",
    requirements: "Experience with editorial makeup, ability to work with diverse skin tones, knowledge of photography-friendly techniques, availability for rehearsal day",
    clientName: "Sarah Jessica Chen",
    clientEmail: "sarah@ecofashionweek.com",
    clientPhone: "+62 812 3456 7890",
    clientCompany: "Eco Fashion Week Indonesia",
    status: "pending",
    createdAt: "2025-01-10T10:30:00Z",
    updatedAt: "2025-01-10T10:30:00Z",
    responseDeadline: "2025-01-13T10:30:00Z",
    clientAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b272?w=100&h=100&fit=crop&crop=face"
  },
  {
    id: "req_002",
    clientId: "client_002",
    muaId: 1, // Sari Dewi
    projectType: "Brand Campaign",
    budgetRange: "Rp 3,000,000 - Rp 5,000,000",
    timeline: "1-2 weeks",
    urgency: "normal",
    description: "Beauty brand campaign for our new skincare line launch. We're looking for natural, glowing makeup looks that showcase healthy skin. The campaign will be used across social media, website, and print materials.",
    requirements: "Natural makeup expertise, understanding of skincare-friendly products, experience with commercial photography",
    clientName: "Michael Zhang",
    clientEmail: "michael@glowbeauty.id",
    clientPhone: "+62 811 2345 6789",
    clientCompany: "Glow Beauty Indonesia",
    status: "accepted",
    createdAt: "2025-01-08T14:15:00Z",
    updatedAt: "2025-01-09T09:20:00Z",
    responseDeadline: "2025-01-11T14:15:00Z",
    clientAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
  },
  {
    id: "req_003",
    clientId: "client_003",
    muaId: 1, // Sari Dewi
    projectType: "Wedding",
    budgetRange: "Rp 1,000,000 - Rp 3,000,000",
    timeline: "1-2 months",
    urgency: "flexible",
    description: "Intimate garden wedding for 50 guests. Looking for a romantic, natural look for the bride and soft, elegant makeup for the bridal party (4 people). The ceremony is outdoors with professional photography and videography.",
    requirements: "Bridal makeup experience, long-lasting formulas for outdoor events, trial session availability",
    clientName: "Amanda Putri",
    clientEmail: "amanda.putri@gmail.com",
    clientPhone: "+62 813 4567 8901",
    status: "in_progress",
    createdAt: "2025-01-05T11:45:00Z",
    updatedAt: "2025-01-07T16:30:00Z",
    responseDeadline: "2025-01-08T11:45:00Z",
    clientAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face"
  },
  {
    id: "req_004",
    clientId: "client_004",
    muaId: 1, // Sari Dewi
    projectType: "Photoshoot",
    budgetRange: "Under Rp 1,000,000",
    timeline: "Within 1 week",
    urgency: "normal",
    description: "Personal branding photoshoot for LinkedIn and website. Need professional but approachable makeup that looks great on camera. The shoot is for a business consultant's new website launch.",
    requirements: "Corporate makeup style, camera-ready techniques, quick touch-ups between outfit changes",
    clientName: "David Santoso",
    clientEmail: "david@businessconsult.id",
    clientPhone: "+62 814 5678 9012",
    clientCompany: "DS Business Consulting",
    status: "declined",
    createdAt: "2025-01-09T09:00:00Z",
    updatedAt: "2025-01-09T15:45:00Z",
    responseDeadline: "2025-01-12T09:00:00Z",
    clientAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
  },
  {
    id: "req_005",
    clientId: "client_005",
    muaId: 1, // Sari Dewi
    projectType: "Product Launch",
    budgetRange: "Above Rp 10,000,000",
    timeline: "More than 2 months",
    urgency: "normal",
    description: "Major cosmetics brand product launch event with 200+ attendees, influencers, and media. Need a lead MUA to coordinate a team and create signature looks that represent the new product line's aesthetic.",
    requirements: "Team leadership experience, event coordination skills, ability to work with influencers and media, portfolio of luxury brand work",
    clientName: "Isabella Rodriguez",
    clientEmail: "isabella@luxecosmetics.com",
    clientPhone: "+62 815 6789 0123",
    clientCompany: "Luxe Cosmetics International",
    status: "counter_offered",
    createdAt: "2025-01-07T13:20:00Z",
    updatedAt: "2025-01-10T11:15:00Z",
    responseDeadline: "2025-01-14T13:20:00Z",
    clientAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face"
  }
];

export const getCollaborationRequestsByMUA = (muaId: number) => {
  return mockCollaborationRequests.filter(request => request.muaId === muaId);
};

export const getCollaborationRequestById = (requestId: string) => {
  return mockCollaborationRequests.find(request => request.id === requestId);
};

export const getRequestStatusColor = (status: CollaborationRequest['status']) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'accepted':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'declined':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'counter_offered':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'in_progress':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'completed':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getRequestStatusLabel = (status: CollaborationRequest['status']) => {
  switch (status) {
    case 'pending':
      return 'Pending Review';
    case 'accepted':
      return 'Accepted';
    case 'declined':
      return 'Declined';
    case 'counter_offered':
      return 'Counter Offer';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    default:
      return 'Unknown';
  }
};

export const getUrgencyColor = (urgency: CollaborationRequest['urgency']) => {
  switch (urgency) {
    case 'urgent':
      return 'text-red-600';
    case 'normal':
      return 'text-gray-600';
    case 'flexible':
      return 'text-green-600';
    default:
      return 'text-gray-600';
  }
};

export const getUrgencyIcon = (urgency: CollaborationRequest['urgency']) => {
  switch (urgency) {
    case 'urgent':
      return '🔥';
    case 'normal':
      return '⏱️';
    case 'flexible':
      return '🌿';
    default:
      return '⏱️';
  }
};