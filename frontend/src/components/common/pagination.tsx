import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/** Pages are zero-based, matching the Spring Boot API. */
export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-end gap-2 pt-4 text-sm">
      <span className="text-muted-foreground">
        Page {page + 1} of {totalPages}
      </span>
      <Button variant="outline" size="sm" disabled={page === 0} onClick={() => onPageChange(page - 1)}>
        Previous
      </Button>
      <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => onPageChange(page + 1)}>
        Next
      </Button>
    </div>
  );
}
