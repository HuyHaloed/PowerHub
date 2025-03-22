import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";

export default function HomePage() {
  return (
    <div>
      <ModeToggle />
      <h1>Home page</h1>
      <Button>Click me</Button>
    </div>
  );
}
