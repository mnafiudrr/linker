import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-8 py-32 text-center">
      <p className="text-sm font-medium">Folder not found.</p>
      <p className="text-xs text-content-muted">
        It may have been deleted or belongs to another user.
      </p>
      <Link href="/dashboard">
        <Button variant="secondary">Back to Home</Button>
      </Link>
    </div>
  );
}
