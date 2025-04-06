import React, { useState } from 'react';
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
import { useBlogPosts } from '@/hooks/useAdminDashboard';
import BlogManagementTable from '@/components/AdminDashboard/BlogManagementTable';
import { 
  FileText, 
  Plus, 
  Search 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/ui/multi-select";

export default function BlogManagement() {
  const { blogPosts, loading, updateBlogPostStatus } = useBlogPosts();
  
  // State for filtering and searching
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [isCreateBlogDialogOpen, setIsCreateBlogDialogOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Collect all unique tags
  const allTags = Array.from(new Set(
    blogPosts.flatMap(post => post.tags || [])
  ));

  // Filter and search logic
  const filteredBlogPosts = blogPosts.filter(post => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'all' || post.status === filterStatus;
    
    const matchesTags = 
      filterTags.length === 0 || 
      filterTags.some(tag => post.tags?.includes(tag));
    
    return matchesSearch && matchesStatus && matchesTags;
  });

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Blog Management
            </CardTitle>
            <Button 
              onClick={() => setIsCreateBlogDialogOpen(true)}
              className="flex items-center"
            >
              <Plus className="mr-2 h-4 w-4" /> Create New Blog
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className="flex space-x-4 mb-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search blogs by title or author"
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
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <MultiSelect
              options={allTags.map(tag => ({ value: tag, label: tag }))}
              value={filterTags}
              onChange={setFilterTags}
              placeholder="Filter by tags"
            />
          </div>

          {/* Blog Table */}
          <BlogManagementTable 
            blogPosts={filteredBlogPosts} 
            onUpdateBlogPostStatus={updateBlogPostStatus}
          />
        </CardContent>
      </Card>

      {/* Create Blog Dialog */}
      <Dialog 
        open={isCreateBlogDialogOpen} 
        onOpenChange={setIsCreateBlogDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Blog Post</DialogTitle>
            <DialogDescription>
              Write and prepare a new blog post for Power Hub
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block mb-2">Blog Title</label>
              <Input placeholder="Enter blog post title" />
            </div>

            <div>
              <label className="block mb-2">Content</label>
              <Textarea
                placeholder="Write your blog post content here"
                className="min-h-[300px]"
              />
            </div>

            <div>
              <label className="block mb-2">Tags</label>
              <MultiSelect
                options={allTags.map(tag => ({ value: tag, label: tag }))}
                value={selectedTags}
                onChange={setSelectedTags}
                onCreate={(newTag) => {
                  // Logic to add new tag
                }}
                placeholder="Select or create tags"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline"
                onClick={() => setIsCreateBlogDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button>Save Draft</Button>
              <Button variant="default">Publish</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}