import React, { useState } from 'react';
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
import { Badge } from "@/components/ui/badge";
import { BlogPost } from '@/types/adminDashboard.types';
import { 
  MoreHorizontal, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Trash2 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BlogManagementTableProps {
  blogPosts: BlogPost[];
  onUpdateBlogPostStatus: (postId: number, status: BlogPost['status']) => void;
  onDeleteBlogPost?: (postId: number) => void;
}

export default function BlogManagementTable({ 
  blogPosts, 
  onUpdateBlogPostStatus,
  onDeleteBlogPost
}: BlogManagementTableProps) {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Status color mapping
  const statusVariants = {
    draft: 'secondary',
    pending: 'warning',
    published: 'success',
    rejected: 'destructive'
  };

  // Open blog post preview
  const openPreview = (post: BlogPost) => {
    setSelectedPost(post);
    setIsPreviewOpen(true);
  };

  // Render blog status badge
  const renderStatusBadge = (status: BlogPost['status']) => {
    const variantMap = {
      draft: 'outline',
      pending: 'warning',
      published: 'success',
      rejected: 'destructive'
    };

    return (
      <Badge variant={variantMap[status] as any}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Blog Management</CardTitle>
            <Button size="sm" variant="outline">
              Create New Post
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blogPosts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium max-w-[250px] truncate">
                    {post.title}
                  </TableCell>
                  <TableCell>{post.author}</TableCell>
                  <TableCell>
                    {post.createdAt.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </TableCell>
                  <TableCell>
                    {renderStatusBadge(post.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {post.tags?.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {(post.tags?.length || 0) > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{(post.tags?.length || 0) - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => openPreview(post)}>
                          <Eye className="mr-2 h-4 w-4" /> Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        {post.status === 'pending' && (
                          <>
                            <DropdownMenuItem 
                              onSelect={() => onUpdateBlogPostStatus(post.id, 'published')}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" /> Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onSelect={() => onUpdateBlogPostStatus(post.id, 'rejected')}
                            >
                              <XCircle className="mr-2 h-4 w-4" /> Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem 
                          onSelect={() => onDeleteBlogPost?.(post.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Blog Post Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Blog Post Preview</DialogTitle>
            <DialogDescription>
              Detailed view of the selected blog post
            </DialogDescription>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">{selectedPost.title}</h2>
                {renderStatusBadge(selectedPost.status)}
              </div>
              
              <div className="flex justify-between text-muted-foreground">
                <span>By {selectedPost.author}</span>
                <span>
                  Created on {selectedPost.createdAt.toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex space-x-2">
                {selectedPost.tags?.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
              
              <ScrollArea className="h-64 border rounded-md p-4">
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedPost.content }}
                />
              </ScrollArea>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                  Close
                </Button>
                {selectedPost.status === 'pending' && (
                  <>
                    <Button
                      onClick={() => {
                        onUpdateBlogPostStatus(selectedPost.id, 'published');
                        setIsPreviewOpen(false);
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        onUpdateBlogPostStatus(selectedPost.id, 'rejected');
                        setIsPreviewOpen(false);
                      }}
                    >
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}