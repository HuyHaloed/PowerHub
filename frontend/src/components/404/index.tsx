import { Button } from "../ui/button";
import { ModeToggle } from "@/components/mode-toggle";
export default function NotFoundPage() {
  return (
    <div>
      <h1 className="text-primary">404 page</h1>
      <ModeToggle />
      <Button variant={"secondary"}>Haha</Button>
    </div>
  );
}
