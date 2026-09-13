"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-provider";
import { RequireRole } from "@/components/auth/require-role";
import { PageHeader } from "@/components/common/page-header";
import { ErrorState, LoadingState } from "@/components/common/state-message";
import { FormField } from "@/components/forms/form-field";
import { NativeSelect } from "@/components/forms/native-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiData } from "@/hooks/use-api-data";
import { adminApi } from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { ROLE_LABELS } from "@/lib/navigation";
import type { Role, User } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROLES = Object.keys(ROLE_LABELS) as Role[];

const createUserSchema = z.object({
  fullName: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email"),
  role: z.enum(["MEMBER", "MANAGER", "ADMIN"]),
  password: z.string().min(8, "At least 8 characters").max(72),
});

type CreateUserValues = z.infer<typeof createUserSchema>;

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const users = useApiData(() => adminApi.users(), []);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { fullName: "", email: "", role: "MEMBER", password: "" },
  });

  async function onCreate(values: CreateUserValues) {
    try {
      await adminApi.createUser(values);
      toast.success(`${values.fullName} added. Share the temporary password with them.`);
      reset();
      users.reload();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setError("email", { message: error.message });
        return;
      }
      toast.error(error instanceof Error ? error.message : "Could not add the user");
    }
  }

  async function runUserAction(user: User, action: () => Promise<User>, successMessage: string) {
    setBusyUserId(user.id);
    try {
      await action();
      toast.success(successMessage);
      users.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the user");
    } finally {
      setBusyUserId(null);
    }
  }

  function toggleActive(user: User) {
    if (user.active && !window.confirm(`Deactivate ${user.fullName}? They won't be able to log in. Their reports are kept.`)) {
      return;
    }
    runUserAction(
      user,
      () => adminApi.setActive(user.id, !user.active),
      user.active ? `${user.fullName} deactivated` : `${user.fullName} reactivated`,
    );
  }

  return (
    <RequireRole roles={["ADMIN"]}>
      <PageHeader title="User management" description="Add team members, assign roles and remove access." />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          {users.error ? (
            <ErrorState error={users.error} onRetry={users.reload} />
          ) : !users.data ? (
            <LoadingState />
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Access</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.data.map((user) => {
                    const isSelf = user.id === currentUser?.id;
                    const busy = busyUserId === user.id;
                    return (
                      <TableRow key={user.id} className={cn(!user.active && "text-muted-foreground")}>
                        <TableCell className="font-medium">
                          {user.fullName}
                          {isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <NativeSelect
                            aria-label={`Role for ${user.fullName}`}
                            className="w-36"
                            value={user.role}
                            disabled={isSelf || busy}
                            onChange={(event) => {
                              const role = event.target.value as Role;
                              runUserAction(user, () => adminApi.changeRole(user.id, role), `${user.fullName} is now ${ROLE_LABELS[role]}`);
                            }}
                          >
                            {ROLES.map((role) => (
                              <option key={role} value={role}>
                                {ROLE_LABELS[role]}
                              </option>
                            ))}
                          </NativeSelect>
                        </TableCell>
                        <TableCell>{user.active ? "Active" : "Deactivated"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant={user.active ? "destructive" : "outline"}
                            size="sm"
                            disabled={isSelf || busy}
                            onClick={() => toggleActive(user)}
                          >
                            {user.active ? "Deactivate" : "Reactivate"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <Card className="lg:sticky lg:top-6 lg:self-start">
          <CardHeader>
            <CardTitle>Add user</CardTitle>
            <CardDescription>Set a temporary password and share it with the new user.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onCreate)} className="space-y-4" noValidate>
              <FormField label="Full name" htmlFor="new-name" error={errors.fullName?.message}>
                <Input id="new-name" {...register("fullName")} />
              </FormField>
              <FormField label="Email" htmlFor="new-email" error={errors.email?.message}>
                <Input id="new-email" type="email" {...register("email")} />
              </FormField>
              <FormField label="Role" htmlFor="new-role" error={errors.role?.message}>
                <NativeSelect id="new-role" {...register("role")}>
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
              <FormField label="Temporary password" htmlFor="new-password" error={errors.password?.message}>
                <Input id="new-password" type="password" autoComplete="new-password" {...register("password")} />
              </FormField>
              <Button type="submit" disabled={isSubmitting}>
                <UserPlus />
                {isSubmitting ? "Adding..." : "Add user"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </RequireRole>
  );
}
