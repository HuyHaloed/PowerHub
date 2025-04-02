export interface Blog {
    id: string | number;
    title: string;
    content?: string;
    excerpt?: string;
    author?: string;
    date?: string;
    image?: string;
    category?: string;
  }
  
  export interface BlogCardProps {
    blog: Blog;
    variant?: "small" | "large" | "grid";
  }