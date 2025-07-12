"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronLeft, ChevronRight, X, Upload, Calendar, DollarSign, FileText, User, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollaborationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  muaName: string;
  muaImage: string;
  onSuccess?: () => void;
}

interface FormData {
  projectType: string;
  budgetRange: string;
  customBudget: string;
  timeline: string;
  urgency: string;
  description: string;
  requirements: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientCompany: string;
}

const PROJECT_TYPES = [
  'Photoshoot',
  'Video/Film',
  'Fashion Show',
  'Wedding',
  'Corporate Event',
  'Product Launch',
  'Brand Campaign',
  'Editorial',
  'Other'
];

const BUDGET_RANGES = [
  'Under Rp 1,000,000',
  'Rp 1,000,000 - Rp 3,000,000',
  'Rp 3,000,000 - Rp 5,000,000',
  'Rp 5,000,000 - Rp 10,000,000',
  'Above Rp 10,000,000',
  'Custom Range'
];

const TIMELINE_OPTIONS = [
  'Within 1 week',
  '1-2 weeks',
  '2-4 weeks',
  '1-2 months',
  'More than 2 months',
  'Flexible'
];

export function CollaborationRequestModal({ isOpen, onClose, muaName, muaImage, onSuccess }: CollaborationRequestModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    projectType: '',
    budgetRange: '',
    customBudget: '',
    timeline: '',
    urgency: 'normal',
    description: '',
    requirements: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientCompany: ''
  });

  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    // TODO: Handle form submission
    console.log('Form submitted:', formData);
    onClose();
    
    // Trigger success callback
    if (onSuccess) {
      onSuccess();
    }
  };

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderProgressBar = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300",
              step <= currentStep
                ? "bg-black text-white"
                : "bg-gray-200 text-gray-500"
            )}
          >
            {step}
          </div>
          {step < 4 && (
            <div
              className={cn(
                "w-16 h-0.5 mx-2 transition-all duration-300",
                step < currentStep ? "bg-black" : "bg-gray-200"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-light tracking-wide mb-2">PROJECT DETAILS</h3>
        <p className="text-gray-600 text-sm">Tell us about your project vision</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium tracking-wide uppercase text-gray-700">Project Type</Label>
          <Select value={formData.projectType} onValueChange={(value) => updateFormData('projectType', value)}>
            <SelectTrigger className="mt-2 h-12">
              <SelectValue placeholder="Select project type" />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium tracking-wide uppercase text-gray-700">Budget Range</Label>
          <Select value={formData.budgetRange} onValueChange={(value) => updateFormData('budgetRange', value)}>
            <SelectTrigger className="mt-2 h-12">
              <SelectValue placeholder="Select budget range" />
            </SelectTrigger>
            <SelectContent>
              {BUDGET_RANGES.map((range) => (
                <SelectItem key={range} value={range}>{range}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {formData.budgetRange === 'Custom Range' && (
          <div>
            <Label className="text-sm font-medium tracking-wide uppercase text-gray-700">Custom Budget</Label>
            <Input
              className="mt-2 h-12"
              placeholder="Enter your budget range"
              value={formData.customBudget}
              onChange={(e) => updateFormData('customBudget', e.target.value)}
            />
          </div>
        )}

        <div>
          <Label className="text-sm font-medium tracking-wide uppercase text-gray-700">Timeline</Label>
          <Select value={formData.timeline} onValueChange={(value) => updateFormData('timeline', value)}>
            <SelectTrigger className="mt-2 h-12">
              <SelectValue placeholder="When do you need this completed?" />
            </SelectTrigger>
            <SelectContent>
              {TIMELINE_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-light tracking-wide mb-2">PROJECT DESCRIPTION</h3>
        <p className="text-gray-600 text-sm">Describe your vision and requirements</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium tracking-wide uppercase text-gray-700">Project Description</Label>
          <Textarea
            className="mt-2 min-h-[120px] resize-none"
            placeholder="Describe your project in detail. What's your vision? What style are you aiming for?"
            value={formData.description}
            onChange={(e) => updateFormData('description', e.target.value)}
          />
        </div>

        <div>
          <Label className="text-sm font-medium tracking-wide uppercase text-gray-700">Specific Requirements</Label>
          <Textarea
            className="mt-2 min-h-[100px] resize-none"
            placeholder="Any specific requirements, styles, or special considerations for this project?"
            value={formData.requirements}
            onChange={(e) => updateFormData('requirements', e.target.value)}
          />
        </div>

        <div>
          <Label className="text-sm font-medium tracking-wide uppercase text-gray-700">Project Urgency</Label>
          <RadioGroup
            value={formData.urgency}
            onValueChange={(value) => updateFormData('urgency', value)}
            className="mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="normal" id="normal" />
              <Label htmlFor="normal" className="text-sm">Normal Priority</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="urgent" id="urgent" />
              <Label htmlFor="urgent" className="text-sm">Urgent</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="flexible" id="flexible" />
              <Label htmlFor="flexible" className="text-sm">Flexible Timeline</Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-light tracking-wide mb-2">CONTACT INFORMATION</h3>
        <p className="text-gray-600 text-sm">Your details for project coordination</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium tracking-wide uppercase text-gray-700">Full Name</Label>
            <Input
              className="mt-2 h-12"
              placeholder="Your full name"
              value={formData.clientName}
              onChange={(e) => updateFormData('clientName', e.target.value)}
            />
          </div>
          <div>
            <Label className="text-sm font-medium tracking-wide uppercase text-gray-700">Company (Optional)</Label>
            <Input
              className="mt-2 h-12"
              placeholder="Company name"
              value={formData.clientCompany}
              onChange={(e) => updateFormData('clientCompany', e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium tracking-wide uppercase text-gray-700">Email Address</Label>
          <Input
            type="email"
            className="mt-2 h-12"
            placeholder="your.email@example.com"
            value={formData.clientEmail}
            onChange={(e) => updateFormData('clientEmail', e.target.value)}
          />
        </div>

        <div>
          <Label className="text-sm font-medium tracking-wide uppercase text-gray-700">Phone Number</Label>
          <Input
            type="tel"
            className="mt-2 h-12"
            placeholder="+62 xxx xxxx xxxx"
            value={formData.clientPhone}
            onChange={(e) => updateFormData('clientPhone', e.target.value)}
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Upload className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-1">Reference Materials (Optional)</h4>
              <p className="text-xs text-blue-700 mb-3">
                Upload mood boards, reference images, or inspiration materials to help convey your vision.
              </p>
              <Button variant="outline" size="sm" className="text-blue-600 border-blue-300 hover:bg-blue-100">
                Upload Files
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-light tracking-wide mb-2">REVIEW & SUBMIT</h3>
        <p className="text-gray-600 text-sm">Please review your collaboration request</p>
      </div>

      <div className="space-y-6">
        {/* MUA Info */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium tracking-wide uppercase text-gray-700 mb-3">Collaborating With</h4>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg overflow-hidden">
              <img src={muaImage} alt={muaName} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="font-medium">{muaName}</div>
              <div className="text-sm text-gray-600">Professional MUA</div>
            </div>
          </div>
        </div>

        {/* Project Summary */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium tracking-wide uppercase text-gray-700 mb-3">Project Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Type:</span>
              <span>{formData.projectType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Budget:</span>
              <span>{formData.budgetRange}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Timeline:</span>
              <span>{formData.timeline}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Urgency:</span>
              <span className="capitalize">{formData.urgency}</span>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium tracking-wide uppercase text-gray-700 mb-3">Contact Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span>{formData.clientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span>{formData.clientEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Phone:</span>
              <span>{formData.clientPhone}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStepIcons = () => {
    const icons = [FileText, DollarSign, User, CheckCheck];
    return (
      <div className="flex justify-center mb-6">
        <div className="flex items-center gap-4">
          {icons.map((Icon, index) => (
            <div
              key={index}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                index + 1 === currentStep
                  ? "bg-black text-white"
                  : index + 1 < currentStep
                  ? "bg-green-100 text-green-600"
                  : "bg-gray-100 text-gray-400"
              )}
            >
              <Icon className="w-5 h-5" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[85vh] overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="border-b border-gray-100 p-6 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-light tracking-wide">
              COLLABORATION REQUEST
            </DialogTitle>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="p-6">
          {renderProgressBar()}
          {renderStepIcons()}

          {/* Step Content */}
          <div className="min-h-[400px]">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-6 mt-6 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="px-6"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                className="bg-black text-white hover:bg-gray-800 px-6"
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="bg-black text-white hover:bg-gray-800 px-8"
              >
                Submit Request
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}