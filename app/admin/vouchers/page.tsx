"use client";

import { useState, useEffect } from 'react';
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { Loader2, Plus, Search, Filter, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AlertCircle } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface Voucher {
  id: string;
  code: string;
  description: string;
  discount_amount: number;
  total_quantity: number;
  remaining_quantity: number;
  is_active: boolean;
  expires_at: string;
  created_at: string;
}

// Add form validation schema
const voucherFormSchema = z.object({
  code: z.string()
    .min(6, "Code must be exactly 6 characters")
    .max(6, "Code must be exactly 6 characters")
    .regex(/^[A-Z0-9]+$/, "Only uppercase letters and numbers are allowed"),
  description: z.string()
    .min(1, "Description is required")
    .max(100, "Description must be less than 100 characters"),
  discount_amount: z.coerce.number()
    .min(1000, "Minimum discount is Rp 1,000")
    .max(10000000, "Maximum discount is Rp 10,000,000"),
  total_quantity: z.coerce.number()
    .min(1, "Minimum quantity is 1")
    .max(1000, "Maximum quantity is 1,000"),
  expires_at: z.string()
    .min(1, "Expiry date is required")
});

type FormData = z.infer<typeof voucherFormSchema>;

interface FieldRenderProps {
  field: {
    value: any;
    onChange: (value: any) => void;
    name: string;
    onBlur: () => void;
    ref: React.Ref<any>;
  };
}

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [filteredVouchers, setFilteredVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(voucherFormSchema),
    defaultValues: {
      code: '',
      description: '',
      discount_amount: 0,
      total_quantity: 0,
      expires_at: ''
    }
  });

  useEffect(() => {
    fetchVouchers();
  }, []);

  useEffect(() => {
    filterVouchers();
  }, [searchQuery, statusFilter, vouchers]);

  const fetchVouchers = async () => {
    setIsLoading(true);
    setError(null);
    const supabase = createClient();
    
    try {
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (!data) {
        throw new Error('No data returned from Supabase');
      }

      setVouchers(data);
      setFilteredVouchers(data);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      setError(error instanceof Error ? error.message : 'Failed to load vouchers');
      toast.error('Failed to load vouchers');
    } finally {
      setIsLoading(false);
    }
  };

  const filterVouchers = () => {
    let filtered = [...vouchers];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(voucher =>
        voucher.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        voucher.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(voucher =>
        statusFilter === 'active' ? voucher.is_active : !voucher.is_active
      );
    }

    setFilteredVouchers(filtered);
  };

  const handleCreateVoucher = async (data: FormData) => {
    if (isCreating) return;
    
    setIsCreating(true);
    setError(null);
    const supabase = createClient();

    try {
      const { data: insertedData, error } = await supabase
        .from('vouchers')
        .insert({
          ...data,
          code: data.code.toUpperCase(),
          remaining_quantity: data.total_quantity,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      if (!insertedData) {
        throw new Error('No data returned after insertion');
      }

      setVouchers(prev => [insertedData, ...prev]);
      toast.success('Voucher created successfully');
      form.reset();
    } catch (error) {
      console.error('Error creating voucher:', error);
      setError(error instanceof Error ? error.message : 'Failed to create voucher');
      toast.error('Failed to create voucher');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRetry = () => {
    fetchVouchers();
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Vouchers</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your vouchers and view their usage performance
            </p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-[#0066FF] hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Voucher
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <div className="px-6 py-6">
                <DialogHeader className="mb-8">
                  <DialogTitle className="text-xl font-semibold">Create New Voucher</DialogTitle>
                  <p className="text-sm text-gray-500 mt-1.5">
                    Add a new voucher code for your customers
                  </p>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleCreateVoucher)} className="space-y-8">
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }: FieldRenderProps) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Voucher Code</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                maxLength={6}
                                className="uppercase bg-gray-50 font-mono text-lg tracking-wider pl-3 pr-10 h-12"
                                placeholder="SUMMER"
                              />
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                {field.value.length}/6
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs text-gray-500">
                            6 characters, uppercase letters and numbers only
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }: FieldRenderProps) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Description</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Summer sale discount"
                              className="bg-gray-50 h-12"
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-gray-500">
                            Brief description of the voucher's purpose
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="discount_amount"
                        render={({ field }: FieldRenderProps) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Discount Amount</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={e => {
                                    const value = e.target.value.replace(/^0+/, '');
                                    field.onChange(value ? parseInt(value) : '');
                                  }}
                                  className="pl-9 bg-gray-50 h-12"
                                  placeholder="50000"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="total_quantity"
                        render={({ field }: FieldRenderProps) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Quantity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={e => field.onChange(Number(e.target.value))}
                                className="bg-gray-50 h-12"
                                placeholder="100"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="expires_at"
                      render={({ field }: FieldRenderProps) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Expiry Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              min={new Date().toISOString().split('T')[0]}
                              className="bg-gray-50 h-12"
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-gray-500">
                            When this voucher will expire
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Preview Card */}
                    <div className="p-5 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="text-sm font-medium text-gray-600 mb-4">Preview</div>
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-lg bg-[#0066FF] flex items-center justify-center">
                          <span className="text-white text-xl font-bold">%</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-mono text-lg font-semibold tracking-wider">
                            {form.watch("code") || "SUMMER"}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {form.watch("description") || "Summer sale discount"}
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-sm font-medium">
                              Rp {form.watch("discount_amount")?.toLocaleString() || "0"}
                            </span>
                            <span className="text-xs text-gray-500">
                              {form.watch("total_quantity") || "0"} vouchers
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isCreating}
                      className={cn(
                        "w-full h-12 text-base font-medium",
                        "bg-[#0066FF] hover:bg-blue-700",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      {isCreating ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Creating...</span>
                        </div>
                      ) : (
                        'Create Voucher'
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search vouchers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
              <p className="text-sm text-gray-500">Loading vouchers...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="flex items-center gap-2 text-red-600 mb-4">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Error loading vouchers</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">{error}</p>
              <Button
                variant="outline"
                onClick={handleRetry}
                className="flex items-center gap-2"
              >
                Try Again
              </Button>
            </div>
          ) : filteredVouchers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-gray-500 mb-4">No vouchers found</p>
              {searchQuery || statusFilter !== 'all' ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              ) : null}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="font-medium">Code</TableHead>
                  <TableHead className="font-medium">Description</TableHead>
                  <TableHead className="font-medium">Discount</TableHead>
                  <TableHead className="font-medium">Usage</TableHead>
                  <TableHead className="font-medium">Status</TableHead>
                  <TableHead className="font-medium">Expires At</TableHead>
                  <TableHead className="font-medium">Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVouchers.map((voucher) => (
                  <TableRow key={voucher.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-medium">{voucher.code}</TableCell>
                    <TableCell className="text-gray-600">{voucher.description}</TableCell>
                    <TableCell>Rp {voucher.discount_amount.toLocaleString()}</TableCell>
                    <TableCell className="text-gray-600">
                      {voucher.remaining_quantity}/{voucher.total_quantity}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        voucher.is_active 
                          ? 'bg-green-50 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {voucher.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {format(new Date(voucher.expires_at), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {format(new Date(voucher.created_at), 'dd MMM yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
} 