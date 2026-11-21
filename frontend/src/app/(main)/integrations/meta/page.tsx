"use client";

import React, { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHeadCell,
  TableHeader,
  TableRow,
  Dialog,
} from "@/src/components/ui";
import {
  useDisconnectMetaIntegration,
  useMetaEvents,
  useMetaIntegration,
  useRetryMetaEvent,
  useSaveMetaIntegration,
  useTestMetaIntegration,
  useUsers,
} from "@/src/hooks";
import { CheckCircle2, Copy, Link2, RefreshCw, Unplug } from "lucide-react";
import { getApiErrorMessage } from "@/src/utils/api-error";

export default function MetaIntegrationPage() {
  const { data: settings, isLoading } = useMetaIntegration();
  const { data: events = [] } = useMetaEvents();
  const { data: users = [] } = useUsers();
  const save = useSaveMetaIntegration();
  const disconnect = useDisconnectMetaIntegration();
  const test = useTestMetaIntegration();
  const retry = useRetryMetaEvent();

  const [connectionError, setConnectionError] = useState("");
  const [connectionSuccess, setConnectionSuccess] = useState("");
  const [form, setForm] = useState({
    enabled: true,
    appId: "",
    appSecret: "",
    pageId: "",
    pageAccessToken: "",
    defaultProjectId: "",
    defaultAssignedUserId: "",
  });

  useEffect(() => {
    if (settings)
      setForm({
        enabled: settings.enabled,
        appId: settings.appId ?? "",
        appSecret: "",
        pageId: settings.pageId ?? "",
        pageAccessToken: "",
        defaultProjectId: settings.defaultProjectId ?? "",
        defaultAssignedUserId: settings.defaultAssignedUserId ?? "",
      });
  }, [settings]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const apiBase = process.env.NEXT_PUBLIC_API_URL || `${origin}/api`;
  const publicApiBase = apiBase.replace(/\/api$/, "");
  const callbackUrl =
    settings?.callbackUrl ??
    (settings?.integrationKey
      ? `${publicApiBase}/api/v1/webhooks/meta/${settings.integrationKey}`
      : "Save settings to generate your callback URL");

  const copy = (value: string) => navigator.clipboard?.writeText(value);

  const handleSave = () => {
    setConnectionError("");
    setConnectionSuccess("");
    save.mutate(form, {
      onSuccess: () =>
        setConnectionSuccess(
          "Meta connection verified and settings saved successfully.",
        ),
      onError: (error) =>
        setConnectionError(
          getApiErrorMessage(error, "Meta settings could not be saved."),
        ),
    });
  };

  const handleTest = () => {
    setConnectionError("");
    setConnectionSuccess("");
    test.mutate(undefined, {
      onSuccess: () =>
        setConnectionSuccess("Meta connection test completed successfully."),
      onError: (error) =>
        setConnectionError(
          getApiErrorMessage(error, "Meta connection test failed."),
        ),
    });
  };

  if (isLoading)
    return (
      <div className="p-8 text-slate-500">Loading Meta integration...</div>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Meta Lead Ads
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Receive Lead Ads submissions in real time through Meta webhooks.
          </p>
        </div>
        {settings && (
          <Badge variant={settings.connected ? "success" : "secondary"}>
            {settings.connected
              ? "Connected"
              : settings.enabled
                ? "Not verified"
                : "Disabled"}
          </Badge>
        )}
      </div>

      {settings?.connected && settings.callbackUrl && (
        <Card padding="lg">
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">
                Webhook callback URL
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all rounded-lg border-2 border-blue-500 bg-blue-50 px-3 py-2 text-xs text-slate-700">
                  {callbackUrl}
                </code>
                <Button
                  size="icon-sm"
                  variant="outline"
                  onClick={() => copy(callbackUrl)}
                  className="cursor-pointer"
                  icon={<Copy />}
                >
                  {" "}
                </Button>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">
                Webhook verify token
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all rounded-lg border-2 border-blue-500 bg-blue-50 px-3 py-2 text-xs text-slate-700">
                  {settings.verifyToken}
                </code>
                <Button
                  size="icon-sm"
                  variant="outline"
                  onClick={() => copy(settings.verifyToken)}
                  className="cursor-pointer"
                  icon={<Copy />}
                >
                  {" "}
                </Button>
              </div>
            </div>
          </div>
          {settings.lastError && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {settings.lastError}
            </p>
          )}
        </Card>
      )}

      <Card padding="lg">
        <h2 className="mb-5 text-lg font-semibold text-slate-900">
          Meta credentials
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Meta App ID"
            value={form.appId}
            onChange={(e) => setForm({ ...form, appId: e.target.value })}
            placeholder="123456789012345"
          />
          <Input
            label="Meta App Secret"
            type="password"
            value={form.appSecret}
            onChange={(e) => setForm({ ...form, appSecret: e.target.value })}
            placeholder={settings?.appSecretMasked ?? "Enter App Secret"}
          />
          <Input
            label="Facebook Page ID"
            value={form.pageId}
            onChange={(e) => setForm({ ...form, pageId: e.target.value })}
            placeholder="Page ID"
          />
          <Input
            label="Page Access Token"
            type="password"
            value={form.pageAccessToken}
            onChange={(e) =>
              setForm({ ...form, pageAccessToken: e.target.value })
            }
            placeholder={
              settings?.pageAccessTokenMasked ?? "Enter Page Access Token"
            }
          />
          <Input
            label="Default Project ID"
            value={form.defaultProjectId}
            onChange={(e) =>
              setForm({ ...form, defaultProjectId: e.target.value })
            }
            placeholder="Optional project UUID"
          />
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Default Executive
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5"
              value={form.defaultAssignedUserId}
              onChange={(e) =>
                setForm({ ...form, defaultAssignedUserId: e.target.value })
              }
            >
              <option value="">Unassigned</option>
              {users.map((user: any) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
            />
            Integration enabled
          </label>
          <Button
            loading={save.isPending}
            onClick={handleSave}
            icon={<CheckCircle2 />}
          >
            Save settings
          </Button>
          {settings && (
            <>
              <Button
                variant="outline"
                loading={test.isPending}
                onClick={handleTest}
                icon={<Link2 />}
              >
                Test connection
              </Button>
              <Button
                variant="destructive"
                loading={disconnect.isPending}
                onClick={() => disconnect.mutate()}
                icon={<Unplug />}
              >
                Disconnect
              </Button>
            </>
          )}
        </div>
      </Card>

      <Card padding="lg">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Recent webhook events
            </h2>
            <p className="text-sm text-slate-500">
              Meta submissions and CRM processing status.
            </p>
          </div>
          <RefreshCw className="h-4 w-4 text-slate-400" />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeadCell>Received</TableHeadCell>
                <TableHeadCell>Leadgen ID</TableHeadCell>
                <TableHeadCell>Page / Form</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Action</TableHeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 ? (
                <TableRow>
                  <TableCell className="py-12 text-center text-slate-500">
                    No webhook events yet.
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      {new Date(event.received_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {event.leadgen_id}
                    </TableCell>
                    <TableCell>
                      {event.page_id ?? "-"} / {event.form_id ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          event.status === "COMPLETED"
                            ? "success"
                            : event.status === "FAILED"
                              ? "danger"
                              : "secondary"
                        }
                      >
                        {event.status}
                      </Badge>
                      {event.error_message && (
                        <p className="mt-1 max-w-xs text-xs text-red-600">
                          {event.error_message}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {event.status === "FAILED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          loading={retry.isPending}
                          onClick={() => retry.mutate(event.id)}
                        >
                          Retry
                        </Button>
                      )}
                      {event.status === "COMPLETED" && event.crm_lead_id && (
                        <span className="text-xs text-slate-500">
                          Lead created
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog
        isOpen={Boolean(connectionError)}
        onClose={() => setConnectionError("")}
        title="Meta connection failed"
        description="The credentials or Facebook Page could not be verified"
        size="md"
      >
        <p className="text-sm text-red-700">{connectionError}</p>
        <div className="mt-5 flex justify-end">
          <Button variant="outline" onClick={() => setConnectionError("")}>
            Close
          </Button>
        </div>
      </Dialog>

      <Dialog
        isOpen={Boolean(connectionSuccess)}
        onClose={() => setConnectionSuccess("")}
        title="Connection successful"
        description="Meta Lead Ads is ready for webhook configuration"
        size="md"
      >
        <p className="text-sm text-slate-700">{connectionSuccess}</p>
        <div className="mt-5 flex justify-end">
          <Button onClick={() => setConnectionSuccess("")}>Done</Button>
        </div>
      </Dialog>
    </div>
  );
}
