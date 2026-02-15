import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation('/projects/1');
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
