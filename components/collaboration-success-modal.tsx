"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, MessageSquare, Bell, X } from 'lucide-react';

interface CollaborationSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  muaName: string;
  muaImage: string;
}

export function CollaborationSuccessModal({ isOpen, onClose, muaName, muaImage }: CollaborationSuccessModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Content */}
        <div className="text-center p-8">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-light tracking-wide mb-4">REQUEST SENT SUCCESSFULLY</h2>
          
          {/* Description */}
          <p className="text-gray-600 mb-8 leading-relaxed">
            Your collaboration request has been sent to <strong>{muaName}</strong>. 
            They typically respond within 48 hours.
          </p>

          {/* MUA Info Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden">
                <img src={muaImage} alt={muaName} className="w-full h-full object-cover" />
              </div>
              <div className="text-left">
                <div className="font-medium">{muaName}</div>
                <div className="text-sm text-gray-600">Professional MUA</div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="text-left mb-8">
            <h3 className="text-sm font-medium tracking-wide uppercase text-gray-700 mb-4">What happens next?</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bell className="w-3 h-3 text-blue-600" />
                </div>
                <div className="text-sm">
                  <div className="font-medium">You'll receive a notification</div>
                  <div className="text-gray-600">When {muaName} responds to your request</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MessageSquare className="w-3 h-3 text-blue-600" />
                </div>
                <div className="text-sm">
                  <div className="font-medium">Start the conversation</div>
                  <div className="text-gray-600">Discuss project details and finalize arrangements</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-3 h-3 text-blue-600" />
                </div>
                <div className="text-sm">
                  <div className="font-medium">Typical response time</div>
                  <div className="text-gray-600">Most MUAs respond within 24-48 hours</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={onClose}
              className="flex-1 bg-black text-white hover:bg-gray-800 h-12"
            >
              Continue Browsing
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-12"
              onClick={() => {
                // TODO: Navigate to messages or requests page
                onClose();
              }}
            >
              View My Requests
            </Button>
          </div>

          {/* Contact Note */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>Need immediate assistance?</strong> You can also reach out via our messaging system 
              or contact our support team for urgent requests.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}