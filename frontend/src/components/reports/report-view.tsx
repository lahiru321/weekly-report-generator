import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatHours } from "@/lib/format";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS, TASK_TYPE_LABELS, TASK_TYPES } from "@/lib/labels";
import type { ReportContent, ReportItem } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Read-only view of a report's content. Used for the current report and for past versions. */
export function ReportView({ content }: { content: ReportContent }) {
  const totalHours = TASK_TYPES.reduce((sum, type) => sum + Number(content.hoursByType[type] ?? 0), 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tasks completed</CardTitle>
          <CardDescription>Project: {content.projectName ?? "none selected"}</CardDescription>
        </CardHeader>
        <CardContent>
          {content.tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks added.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Progress (planned / actual)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Time (planned / spent)</TableHead>
                    <TableHead>Output</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {content.tasks.map((task, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{task.name}</TableCell>
                      <TableCell>{TASK_PRIORITY_LABELS[task.priority]}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${task.actualPct}%` }} />
                          </div>
                          <span className="whitespace-nowrap text-xs text-muted-foreground">
                            {task.plannedPct}% / {task.actualPct}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{TASK_STATUS_LABELS[task.status]}</TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        {formatHours(task.plannedHours)} / {formatHours(task.spentHours)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{task.output ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Blockers / challenges</CardTitle>
          </CardHeader>
          <CardContent>
            <ItemList items={content.blockers} keyLabel="Key issue" tone="amber" emptyText="No blockers." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Achievements / highlights</CardTitle>
          </CardHeader>
          <CardContent>
            <ItemList
              items={content.achievements}
              keyLabel="Key achievement"
              tone="emerald"
              emptyText="No achievements."
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Planned for next week</CardTitle>
          </CardHeader>
          <CardContent>
            {content.nextWeekTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing planned.</p>
            ) : (
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {content.nextWeekTasks.map((task, index) => (
                  <li key={index}>{task}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Hours by task type</CardTitle>
            <CardDescription>Total: {formatHours(totalHours)}</CardDescription>
          </CardHeader>
          <CardContent>
            {totalHours === 0 ? (
              <p className="text-sm text-muted-foreground">Not provided.</p>
            ) : (
              <dl className="space-y-2 text-sm">
                {TASK_TYPES.filter((type) => Number(content.hoursByType[type] ?? 0) > 0).map((type) => (
                  <div key={type} className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{TASK_TYPE_LABELS[type]}</dt>
                    <dd className="font-medium">{formatHours(content.hoursByType[type])}</dd>
                  </div>
                ))}
              </dl>
            )}
          </CardContent>
        </Card>
      </div>

      {(content.notes || content.links) && (
        <Card>
          <CardHeader>
            <CardTitle>Notes & links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {content.notes && <p className="whitespace-pre-wrap">{content.notes}</p>}
            {content.links && (
              <ul className="space-y-1">
                {content.links
                  .split("\n")
                  .map((link) => link.trim())
                  .filter(Boolean)
                  .map((link, index) => (
                    <li key={index} className="break-all">
                      {/* Only http(s) links are clickable, so javascript: URLs can't be injected */}
                      {/^https?:\/\//i.test(link) ? (
                        <a href={link} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">
                          {link}
                        </a>
                      ) : (
                        link
                      )}
                    </li>
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ItemList({
  items,
  keyLabel,
  tone,
  emptyText,
}: {
  items: ReportItem[];
  keyLabel: string;
  tone: "amber" | "emerald";
  emptyText: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {items.map((item, index) => (
        <li
          key={index}
          className={cn(
            "rounded-md border px-3 py-2",
            item.isKey &&
              (tone === "amber"
                ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40"
                : "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40"),
          )}
        >
          {item.isKey && (
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {keyLabel}
            </span>
          )}
          {item.description}
        </li>
      ))}
    </ul>
  );
}
