import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { CustomerFeedback } from '@/types/adminDashboard.types';
import { MoreHorizontal, Eye, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface CustomerFeedbackListProps {
  feedbacks: CustomerFeedback[];
  onUpdateFeedbackStatus: (feedbackId: number, status: CustomerFeedback['status']) => void;
}

export default function CustomerFeedbackList({ 
  feedbacks, 
  onUpdateFeedbackStatus 
}: CustomerFeedbackListProps) {
  const getStatusVariant = (status: CustomerFeedback['status']) => {
    switch (status) {
      case 'unread': return 'secondary';
      case 'in-progress': return 'warning';
      case 'resolved': return 'success';
    }
  };

  const renderStarRating = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Feedback</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feedbacks.map((feedback) => (
              <TableRow key={feedback.id}>
                <TableCell>{feedback.customerName}</TableCell>
                <TableCell>
                  <span className="text-yellow-500">
                    {renderStarRating(feedback.rating)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="max-w-[200px] truncate" title={feedback.message}>
                    {feedback.message}
                  </div>
                </TableCell>
                <TableCell>
                  {feedback.createdAt.toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge variant={
                    feedback.status === 'unread' ? 'secondary' :
                    feedback.status === 'in-progress' ? 'default' :
                    feedback.status === 'resolved' ? 'outline' : 'default'
                  }>
                    {feedback.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onSelect={() => {}}>
                        <Eye className="mr-2 h-4 w-4" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onSelect={() => 
                          onUpdateFeedbackStatus(feedback.id, 'in-progress')
                        }
                      >
                        <CheckCircle className="mr-2 h-4 w-4" /> Mark In Progress
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onSelect={() => 
                          onUpdateFeedbackStatus(feedback.id, 'resolved')
                        }
                      >
                        <XCircle className="mr-2 h-4 w-4" /> Mark Resolved
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>

            ))}          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}