"use client";

import { useState } from 'react';
import { cn } from "@/lib/utils";
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  User,
  Twitch,
  Youtube,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface StreamerVerification {
  id: string;
  name: string;
  email: string;
  platform: 'twitch' | 'youtube';
  channelUrl: string;
  followers: number;
  status: 'pending' | 'verified' | 'rejected';
  submittedAt: string;
  avatarUrl: string;
}

const mockStreamers: StreamerVerification[] = [
  {
    id: '1',
    name: 'GamingPro',
    email: 'pro@gaming.com',
    platform: 'twitch',
    channelUrl: 'https://twitch.tv/gamingpro',
    followers: 50000,
    status: 'pending',
    submittedAt: '2024-03-10',
    avatarUrl: '/avatars/gamingpro.jpg',
  },
  {
    id: '2',
    name: 'TechReviewer',
    email: 'tech@reviewer.com',
    platform: 'youtube',
    channelUrl: 'https://youtube.com/techreviewer',
    followers: 75000,
    status: 'pending',
    submittedAt: '2024-03-09',
    avatarUrl: '/avatars/techreviewer.jpg',
  },
];

export default function StreamerVerificationPage() {
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const getStatusBadge = (status: StreamerVerification['status']) => {
    switch (status) {
      case 'verified':
        return (
          <Badge className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Verified
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <AlertCircle className="w-3.5 h-3.5 mr-1" />
            Pending Review
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="w-3.5 h-3.5 mr-1" />
            Rejected
          </Badge>
        );
    }
  };

  const getPlatformBadge = (platform: StreamerVerification['platform']) => {
    switch (platform) {
      case 'twitch':
        return (
          <Badge className="bg-purple-50 text-purple-700 border-purple-200">
            <Twitch className="w-3.5 h-3.5 mr-1" />
            Twitch
          </Badge>
        );
      case 'youtube':
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200">
            <Youtube className="w-3.5 h-3.5 mr-1" />
            YouTube
          </Badge>
        );
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Streamer Verification</h1>
          <p className="mt-1 text-sm text-gray-500">
            Review and verify streamer registration requests
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={filterStatus}
          onValueChange={setFilterStatus}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Verification Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="font-medium w-[250px]">Streamer</TableHead>
              <TableHead className="font-medium">Platform</TableHead>
              <TableHead className="font-medium">Followers</TableHead>
              <TableHead className="font-medium">Status</TableHead>
              <TableHead className="font-medium">Submitted</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockStreamers.map((streamer) => (
              <TableRow key={streamer.id} className="hover:bg-gray-50/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={streamer.avatarUrl} alt={streamer.name} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-gray-900">{streamer.name}</div>
                      <div className="text-sm text-gray-500">{streamer.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getPlatformBadge(streamer.platform)}</TableCell>
                <TableCell className="text-gray-500">
                  {new Intl.NumberFormat().format(streamer.followers)}
                </TableCell>
                <TableCell>{getStatusBadge(streamer.status)}</TableCell>
                <TableCell className="text-gray-500">
                  {new Date(streamer.submittedAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>View Profile</DropdownMenuItem>
                      <DropdownMenuItem>
                        <a href={streamer.channelUrl} target="_blank" rel="noopener noreferrer">
                          Visit Channel
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-green-600">
                        Approve Streamer
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        Reject Request
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Showing 1-2 of 2 requests
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 