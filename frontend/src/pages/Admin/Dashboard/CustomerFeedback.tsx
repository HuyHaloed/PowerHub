import React, { useState, useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageCircle, 
  Filter, 
  Search, 
  Star 
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

// Mock data structure (replace with actual data source)
interface Feedback {
  id: number;
  customerName: string;
  email: string;
  message: string;
  rating: number;
  status: 'unread' | 'in-progress' | 'resolved';
  createdAt: Date;
}

export default function CustomerFeedback() {
  // Mock feedback data
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([
    {
      id: 1,
      customerName: 'John Doe',
      email: 'john@example.com',
      message: 'The energy monitoring feature is amazing!',
      rating: 5,
      status: 'unread',
      createdAt: new Date()
    },
    {
      id: 2,
      customerName: 'Jane Smith',
      email: 'jane@example.com',
      message: 'Would like to see more detailed energy reports',
      rating: 4,
      status: 'in-progress',
      createdAt: new Date()
    }
  ]);

  // State for filtering and searching
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);

  // Filtered feedbacks
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter(feedback => {
      const matchesSearch = 
        feedback.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.message.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        filterStatus === 'all' || feedback.status === filterStatus;
      
      const matchesRating = 
        filterRating === 'all' || feedback.rating === Number(filterRating);
      
      return matchesSearch && matchesStatus && matchesRating;
    });
  }, [feedbacks, searchTerm, filterStatus, filterRating]);

  // Render star rating
  const renderStarRating = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star 
        key={index} 
        className={`h-4 w-4 ${index < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
      />
    ));
  };

  // Open response modal
  const openResponseModal = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setIsResponseModalOpen(true);
  };

  // Status badge colors
  const getStatusBadgeVariant = (status: Feedback['status']) => {
    switch (status) {
      case 'unread': return 'secondary';
      case 'in-progress': return 'warning';
      case 'resolved': return 'success';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <MessageCircle className="mr-2 h-5 w-5" />
              Customer Feedback
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className="flex space-x-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search feedback by customer name or message"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select 
              value={filterStatus}
              onValueChange={setFilterStatus}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filterRating}
              onValueChange={setFilterRating}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Feedback List */}
          <div className="space-y-4">
            {filteredFeedbacks.map((feedback) => (
              <Card key={feedback.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-grow">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">{feedback.customerName}</h3>
                        <Badge variant={feedback.status === 'resolved' ? 'default' : feedback.status === 'in-progress' ? 'secondary' : 'destructive'}>
                          {feedback.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-2">{feedback.message}</p>
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {renderStarRating(feedback.rating)}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {feedback.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openResponseModal(feedback)}
                    >
                      Respond
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}          </div>
        </CardContent>
      </Card>

      {/* Response Dialog */}
      <Dialog 
        open={isResponseModalOpen} 
        onOpenChange={setIsResponseModalOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Respond to Feedback</DialogTitle>
            <DialogDescription>
              {selectedFeedback && `Feedback from ${selectedFeedback.customerName}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedFeedback && (
            <div className="space-y-4">
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <p className="italic mb-2">"{selectedFeedback.message}"</p>
                  <div className="flex justify-between items-center">
                    <div className="flex">
                      {renderStarRating(selectedFeedback.rating)}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {selectedFeedback.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <div>
                <label className="block mb-2">Your Response</label>
                <Textarea
                  placeholder="Write a detailed and empathetic response to the customer's feedback"
                  className="min-h-[150px]"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => setIsResponseModalOpen(false)}
            >
              Cancel
            </Button>
            <Button>Send Response</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}