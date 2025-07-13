// Collaboration service for Supabase integration
// Replaces functions from /data/mock-collaboration-requests.ts

import { createClient } from '@/utils/supabase/client';

// Type definitions matching Supabase schema
export interface CollaborationRequest {
  id: string;
  client_id: string;
  mua_id: string;
  project_type: string;
  budget_range?: string;
  custom_budget?: string;
  timeline?: string;
  urgency: 'normal' | 'urgent' | 'flexible';
  description: string;
  requirements?: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  client_company?: string;
  status: 'pending' | 'accepted' | 'declined' | 'counter_offered' | 'in_progress' | 'completed';
  response_deadline?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CollaborationRequestWithProfiles extends CollaborationRequest {
  client_display_name?: string;
  client_image_url?: string;
  mua_display_name?: string;
  mua_image_url?: string;
}

class CollaborationService {
  private supabase = createClient();

  // Get all collaboration requests
  async getAllRequests(): Promise<CollaborationRequest[]> {
    try {
      const { data: requests, error } = await this.supabase
        .from('collaboration_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return requests || [];
    } catch (error) {
      console.error('Error fetching collaboration requests:', error);
      return [];
    }
  }

  // Get collaboration requests by MUA ID
  async getRequestsByMUA(muaId: string): Promise<CollaborationRequestWithProfiles[]> {
    try {
      const { data: requests, error } = await this.supabase
        .from('active_collaboration_requests') // Using the view
        .select('*')
        .eq('mua_id', muaId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return requests || [];
    } catch (error) {
      console.error('Error fetching MUA collaboration requests:', error);
      return [];
    }
  }

  // Get collaboration requests by Client ID
  async getRequestsByClient(clientId: string): Promise<CollaborationRequestWithProfiles[]> {
    try {
      const { data: requests, error } = await this.supabase
        .from('active_collaboration_requests') // Using the view
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return requests || [];
    } catch (error) {
      console.error('Error fetching client collaboration requests:', error);
      return [];
    }
  }

  // Get collaboration request by ID
  async getRequestById(requestId: string): Promise<CollaborationRequestWithProfiles | null> {
    try {
      const { data: request, error } = await this.supabase
        .from('active_collaboration_requests') // Using the view
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) throw error;
      return request;
    } catch (error) {
      console.error('Error fetching collaboration request by ID:', error);
      return null;
    }
  }

  // Create new collaboration request
  async createRequest(requestData: Omit<CollaborationRequest, 'id' | 'created_at' | 'updated_at'>): Promise<CollaborationRequest | null> {
    try {
      const { data: request, error } = await this.supabase
        .from('collaboration_requests')
        .insert(requestData)
        .select()
        .single();

      if (error) throw error;
      return request;
    } catch (error) {
      console.error('Error creating collaboration request:', error);
      return null;
    }
  }

  // Update collaboration request status
  async updateRequestStatus(
    requestId: string, 
    status: CollaborationRequest['status'],
    notes?: string
  ): Promise<CollaborationRequest | null> {
    try {
      const updateData: Partial<CollaborationRequest> = { status };
      if (notes) updateData.notes = notes;

      const { data: request, error } = await this.supabase
        .from('collaboration_requests')
        .update(updateData)
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return request;
    } catch (error) {
      console.error('Error updating collaboration request status:', error);
      return null;
    }
  }

  // Accept collaboration request
  async acceptRequest(requestId: string, notes?: string): Promise<CollaborationRequest | null> {
    return this.updateRequestStatus(requestId, 'accepted', notes);
  }

  // Decline collaboration request
  async declineRequest(requestId: string, notes?: string): Promise<CollaborationRequest | null> {
    return this.updateRequestStatus(requestId, 'declined', notes);
  }

  // Send counter offer
  async counterOfferRequest(requestId: string, notes: string): Promise<CollaborationRequest | null> {
    return this.updateRequestStatus(requestId, 'counter_offered', notes);
  }

  // Mark request as in progress
  async startProgress(requestId: string): Promise<CollaborationRequest | null> {
    return this.updateRequestStatus(requestId, 'in_progress');
  }

  // Complete collaboration request
  async completeRequest(requestId: string): Promise<CollaborationRequest | null> {
    return this.updateRequestStatus(requestId, 'completed');
  }

  // Get requests by status
  async getRequestsByStatus(status: CollaborationRequest['status']): Promise<CollaborationRequestWithProfiles[]> {
    try {
      const { data: requests, error } = await this.supabase
        .from('active_collaboration_requests')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return requests || [];
    } catch (error) {
      console.error('Error fetching requests by status:', error);
      return [];
    }
  }

  // Get pending requests (for notifications)
  async getPendingRequests(): Promise<CollaborationRequestWithProfiles[]> {
    return this.getRequestsByStatus('pending');
  }

  // Get urgent requests
  async getUrgentRequests(): Promise<CollaborationRequestWithProfiles[]> {
    try {
      const { data: requests, error } = await this.supabase
        .from('active_collaboration_requests')
        .select('*')
        .eq('urgency', 'urgent')
        .in('status', ['pending', 'counter_offered'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return requests || [];
    } catch (error) {
      console.error('Error fetching urgent requests:', error);
      return [];
    }
  }

  // Get requests with approaching deadlines
  async getRequestsWithDeadlines(): Promise<CollaborationRequestWithProfiles[]> {
    try {
      const { data: requests, error } = await this.supabase
        .from('active_collaboration_requests')
        .select('*')
        .not('response_deadline', 'is', null)
        .lt('response_deadline', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()) // Next 24 hours
        .in('status', ['pending', 'counter_offered'])
        .order('response_deadline', { ascending: true });

      if (error) throw error;
      return requests || [];
    } catch (error) {
      console.error('Error fetching requests with deadlines:', error);
      return [];
    }
  }

  // Delete collaboration request (admin only)
  async deleteRequest(requestId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('collaboration_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting collaboration request:', error);
      return false;
    }
  }

  // Search collaboration requests
  async searchRequests(query: string): Promise<CollaborationRequestWithProfiles[]> {
    try {
      const { data: requests, error } = await this.supabase
        .from('active_collaboration_requests')
        .select('*')
        .or(`project_type.ilike.%${query}%,description.ilike.%${query}%,client_name.ilike.%${query}%,client_company.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return requests || [];
    } catch (error) {
      console.error('Error searching collaboration requests:', error);
      return [];
    }
  }

  // Helper functions for UI (matching mock-collaboration-requests.ts)
  getRequestStatusColor(status: CollaborationRequest['status']): string {
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
  }

  getRequestStatusLabel(status: CollaborationRequest['status']): string {
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
  }

  getUrgencyColor(urgency: CollaborationRequest['urgency']): string {
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
  }

  getUrgencyIcon(urgency: CollaborationRequest['urgency']): string {
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
  }

  // Get statistics for dashboard
  async getCollaborationStats(userId: string, userType: 'mua' | 'client'): Promise<{
    total: number;
    pending: number;
    accepted: number;
    completed: number;
    inProgress: number;
  }> {
    try {
      const field = userType === 'mua' ? 'mua_id' : 'client_id';
      
      const { data: requests, error } = await this.supabase
        .from('collaboration_requests')
        .select('status')
        .eq(field, userId);

      if (error) throw error;

      const stats = {
        total: requests?.length || 0,
        pending: 0,
        accepted: 0,
        completed: 0,
        inProgress: 0
      };

      requests?.forEach(request => {
        switch (request.status) {
          case 'pending':
            stats.pending++;
            break;
          case 'accepted':
            stats.accepted++;
            break;
          case 'completed':
            stats.completed++;
            break;
          case 'in_progress':
            stats.inProgress++;
            break;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error fetching collaboration stats:', error);
      return {
        total: 0,
        pending: 0,
        accepted: 0,
        completed: 0,
        inProgress: 0
      };
    }
  }
}

// Export singleton instance
export const collaborationService = new CollaborationService();

// Export compatibility functions (to match mock-collaboration-requests.ts exports)
export const getCollaborationRequestsByMUA = (muaId: string) => collaborationService.getRequestsByMUA(muaId);
export const getCollaborationRequestById = (requestId: string) => collaborationService.getRequestById(requestId);
export const getRequestStatusColor = (status: CollaborationRequest['status']) => collaborationService.getRequestStatusColor(status);
export const getRequestStatusLabel = (status: CollaborationRequest['status']) => collaborationService.getRequestStatusLabel(status);
export const getUrgencyColor = (urgency: CollaborationRequest['urgency']) => collaborationService.getUrgencyColor(urgency);
export const getUrgencyIcon = (urgency: CollaborationRequest['urgency']) => collaborationService.getUrgencyIcon(urgency);