import { HugeiconsIcon } from "@hugeicons/react";
import { Image01Icon, AddSquareIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ExportsEmptyState() {
  return (
    <div className="rounded-2xl border-fade p-12 flex flex-col items-center justify-center text-center gap-4">
      <HugeiconsIcon icon={Image01Icon} size={28} strokeWidth={1.5} className="text-muted-foreground" />
      <div>
        <p className="font-medium font-heading">No exports yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Your created visuals will appear here.
        </p>
      </div>
      <Button asChild variant="default">
        <Link href="/dashboard/editor">
          <HugeiconsIcon icon={AddSquareIcon} size={18} strokeWidth={2} />
          Create your first visual
        </Link>
      </Button>
    </div>
  );
}
