"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { RequireRole } from "@/components/auth/require-role";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/state-message";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useApiData } from "@/hooks/use-api-data";
import { ApiError } from "@/lib/api";
import { projectsApi } from "@/lib/projects-api";
import { teamApi } from "@/lib/team-api";
import type { Project } from "@/lib/types";

const projectSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  description: z.string().max(500),
  memberIds: z.array(z.number()),
});

type ProjectValues = z.infer<typeof projectSchema>;

const EMPTY_PROJECT: ProjectValues = { name: "", description: "", memberIds: [] };

export default function ProjectsPage() {
  const projects = useApiData(() => projectsApi.list(), []);
  const members = useApiData(() => teamApi.members(), []);
  const [editing, setEditing] = useState<Project | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProjectValues>({ resolver: zodResolver(projectSchema), defaultValues: EMPTY_PROJECT });
  const selectedMemberIds = useWatch({ control, name: "memberIds" });

  function toggleMember(memberId: number) {
    const next = selectedMemberIds.includes(memberId)
      ? selectedMemberIds.filter((id) => id !== memberId)
      : [...selectedMemberIds, memberId];
    setValue("memberIds", next, { shouldDirty: true });
  }

  function startEdit(project: Project) {
    setEditing(project);
    reset({
      name: project.name,
      description: project.description ?? "",
      memberIds: project.members.map((member) => member.id),
    });
  }

  function cancelEdit() {
    setEditing(null);
    reset(EMPTY_PROJECT);
  }

  async function onSubmit(values: ProjectValues) {
    try {
      if (editing) {
        await projectsApi.update(editing.id, values);
        toast.success("Project updated");
      } else {
        await projectsApi.create(values);
        toast.success("Project added");
      }
      cancelEdit();
      projects.reload();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setError("name", { message: error.message });
        return;
      }
      toast.error(error instanceof Error ? error.message : "Could not save the project");
    }
  }

  async function handleDelete(project: Project) {
    const confirmed = window.confirm(
      `Delete "${project.name}"? Existing reports keep their content but lose this project tag.`,
    );
    if (!confirmed) return;
    try {
      await projectsApi.remove(project.id);
      toast.success("Project deleted");
      if (editing?.id === project.id) cancelEdit();
      projects.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete the project");
    }
  }

  return (
    <RequireRole roles={["MANAGER", "ADMIN"]}>
      <PageHeader title="Projects & categories" description="Projects team members tag their weekly reports with." />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          {projects.error ? (
            <ErrorState error={projects.error} onRetry={projects.reload} />
          ) : !projects.data ? (
            <LoadingState />
          ) : projects.data.length === 0 ? (
            <EmptyState title="No projects yet" description="Add the first project using the form." />
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.data.map((project) => (
                    <TableRow key={project.id} className={editing?.id === project.id ? "bg-muted/50" : undefined}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell className="max-w-64 whitespace-normal text-muted-foreground">
                        {project.description ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-64 whitespace-normal">
                        {project.members.length === 0
                          ? <span className="text-muted-foreground">No members</span>
                          : project.members.map((member) => member.fullName).join(", ")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" aria-label={`Edit ${project.name}`} onClick={() => startEdit(project)}>
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${project.name}`}
                          onClick={() => handleDelete(project)}
                        >
                          <Trash2 />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <Card className="lg:sticky lg:top-6 lg:self-start">
          <CardHeader>
            <CardTitle>{editing ? `Edit "${editing.name}"` : "Add project"}</CardTitle>
            <CardDescription>Assigning members is optional.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <FormField label="Name" htmlFor="project-name" error={errors.name?.message}>
                <Input id="project-name" aria-invalid={!!errors.name} {...register("name")} />
              </FormField>

              <FormField label="Description" htmlFor="project-description" error={errors.description?.message}>
                <Textarea id="project-description" rows={3} {...register("description")} />
              </FormField>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Team members</legend>
                {members.error ? (
                  <p className="text-sm text-destructive">{members.error.message}</p>
                ) : !members.data ? (
                  <p className="text-sm text-muted-foreground">Loading members...</p>
                ) : (
                  <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-md border p-2">
                    {members.data.map((member) => (
                      <label key={member.id} className="flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="size-3.5 accent-primary"
                          checked={selectedMemberIds.includes(member.id)}
                          onChange={() => toggleMember(member.id)}
                        />
                        {member.fullName}
                      </label>
                    ))}
                  </div>
                )}
              </fieldset>

              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {editing ? <Pencil /> : <Plus />}
                  {isSubmitting ? "Saving..." : editing ? "Save changes" : "Add project"}
                </Button>
                {editing && (
                  <Button type="button" variant="outline" onClick={cancelEdit}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </RequireRole>
  );
}
