"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusPill } from "@/components/ui/StatusPill";

const SAMPLE_N8N_WORKFLOW = {
  name: "AccessAble AI - Automated PR Accessibility Gate",
  nodes: [
    {
      parameters: {
        httpMethod: "POST",
        path: "accessable-pr-check",
        responseMode: "onReceived",
        options: {},
      },
      name: "GitHub Webhook",
      type: "n8n-nodes-base.webhook",
      typeVersion: 1,
      position: [250, 300],
    },
    {
      parameters: {
        url: "http://localhost:3000/api/audit",
        method: "POST",
        sendHeaders: true,
        headerParameters: {
          parameters: [
            {
              name: "Content-Type",
              value: "application/json",
            },
          ],
        },
        sendBody: true,
        bodyParameters: {
          parameters: [
            {
              name: "targetUrl",
              value: "http://localhost:3000/demo",
            },
          ],
        },
      },
      name: "Run axe-core Scan",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.1,
      position: [480, 300],
    },
    {
      parameters: {
        url: "http://localhost:3000/api/journeys",
        method: "POST",
        sendHeaders: true,
        headerParameters: {
          parameters: [
            {
              name: "Content-Type",
              value: "application/json",
            },
          ],
        },
        sendBody: true,
        bodyParameters: {
          parameters: [
            {
              name: "targetUrl",
              value: "http://localhost:3000/demo",
            },
          ],
        },
      },
      name: "Run Playwright Journeys",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.1,
      position: [700, 300],
    },
    {
      parameters: {
        conditions: {
          number: [
            {
              value1: "={{$node['Run axe-core Scan'].json['issueCounts']['critical']}}",
              operation: "equal",
              value2: 0,
            },
          ],
        },
      },
      name: "Evaluate Task Blockers",
      type: "n8n-nodes-base.if",
      typeVersion: 1,
      position: [920, 300],
    },
    {
      parameters: {
        channel: "#accessibility-alerts",
        text: "={{'🚨 AccessAble AI Barrier Alert: ' + $node['Run axe-core Scan'].json['issueCounts']['critical'] + ' critical task blockers detected on demo portal!'}}",
      },
      name: "Send Slack Alert",
      type: "n8n-nodes-base.slack",
      typeVersion: 1,
      position: [1140, 420],
    },
    {
      parameters: {
        text: "AccessAble AI automated gate passed: Zero task-blocking accessibility barriers detected.",
      },
      name: "Pass PR Check",
      type: "n8n-nodes-base.github",
      typeVersion: 1,
      position: [1140, 180],
    },
  ],
  connections: {
    "GitHub Webhook": {
      main: [[{ node: "Run axe-core Scan", type: "main", index: 0 }]],
    },
    "Run axe-core Scan": {
      main: [[{ node: "Run Playwright Journeys", type: "main", index: 0 }]],
    },
    "Run Playwright Journeys": {
      main: [[{ node: "Evaluate Task Blockers", type: "main", index: 0 }]],
    },
    "Evaluate Task Blockers": {
      main: [
        [{ node: "Pass PR Check", type: "main", index: 0 }],
        [{ node: "Send Slack Alert", type: "main", index: 0 }],
      ],
    },
  },
};

export default function AutomationPage() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [testStatus, setTestStatus] = useState<
    "idle" | "testing" | "unconfigured" | "failed" | "success"
  >("idle");
  const [testMessage, setTestMessage] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(SAMPLE_N8N_WORKFLOW, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadJson = () => {
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", "/accessable-n8n-workflow.json");
    downloadAnchor.setAttribute("download", "accessable-n8n-workflow.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleTestLocalEndpoint = async () => {
    setTestStatus("testing");
    setTestMessage("Dispatching test request to local /api/automation/webhook endpoint...");

    try {
      const res = await fetch("/api/automation/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test" }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestStatus("success");
        setTestMessage(
          `Local Webhook Endpoint Verified! Execution ID: ${data.executionId} • Target: ${data.target} • Status: ${data.status.toUpperCase()}`
        );
      } else {
        setTestStatus("failed");
        setTestMessage(`Webhook Rejected: ${data.error || "Execution failed"}`);
      }
    } catch (err) {
      setTestStatus("failed");
      setTestMessage(err instanceof Error ? err.message : "Failed to dispatch local test request.");
    }
  };

  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!webhookUrl.trim()) {
      setTestStatus("unconfigured");
      setTestMessage(
        "Configuration Missing: Please specify an active n8n webhook URL or use the Local Test Trigger below."
      );
      return;
    }

    setTestStatus("testing");
    setTestMessage("Testing connectivity to specified external webhook...");

    try {
      new URL(webhookUrl);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "ping",
          source: "AccessAble AI Automation Tester",
          timestamp: new Date().toISOString(),
        }),
        signal: controller.signal,
        mode: "no-cors",
      });

      clearTimeout(timeoutId);
      setTestStatus("success");
      setTestMessage(
        `Payload successfully dispatched to webhook endpoint: ${webhookUrl}`
      );
    } catch (err) {
      setTestStatus("failed");
      setTestMessage(
        err instanceof Error
          ? `Connection Failed: ${err.message}. Ensure your n8n service is running and accessible.`
          : "Connection Failed: Webhook server unreachable."
      );
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="CONTINUOUS INTEGRATION GATEWAY"
        title="CI/CD & n8n Automation Engine"
        description="Automate accessibility regression scanning and safe remediation gates on pull requests via n8n workflow orchestrations."
        action={
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-400" />
            <span className="text-xs font-semibold text-neutral-600 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200">
              Not Connected — Ready for Webhook Integration
            </span>
          </div>
        }
      />

      {/* Main Connection Status Card */}
      <div className="p-6 sm:p-8 rounded-[24px] bg-[#F4F5F7] border border-neutral-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200/80 pb-4">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="text-base font-bold text-neutral-950">
              Integration Status: Not Connected
            </h2>
          </div>
          <span className="text-xs font-medium text-neutral-500">
            Self-hosted n8n / GitHub Actions compatible
          </span>
        </div>

        <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-3xl">
          AccessAble AI exposes standard HTTP endpoints (
          <code className="font-mono bg-white px-2 py-0.5 rounded text-neutral-900 border border-neutral-200">
            POST /api/audit
          </code>{" "}
          and{" "}
          <code className="font-mono bg-white px-2 py-0.5 rounded text-neutral-900 border border-neutral-200">
            POST /api/journeys
          </code>
          ) to enable continuous testing in your build pipeline. To connect your
          n8n instance, import the provided workflow template below and configure
          the incoming webhook URL.
        </p>
      </div>

      {/* Architecture Diagram Section */}
      <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-neutral-200 shadow-xs space-y-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
          Automated Pipeline Architecture
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-medium">
          <div className="p-4 rounded-2xl bg-[#F4F5F7] border border-neutral-200/70 space-y-2">
            <div className="flex items-center gap-2 font-bold text-neutral-950">
              <span className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10px]">
                1
              </span>
              GitHub PR Webhook
            </div>
            <p className="text-neutral-500 text-[11px] leading-relaxed">
              Pull request opened or updated. GitHub dispatches a webhook to n8n.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F4F5F7] border border-neutral-200/70 space-y-2">
            <div className="flex items-center gap-2 font-bold text-neutral-950">
              <span className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10px]">
                2
              </span>
              AccessAble AI Audit
            </div>
            <p className="text-neutral-500 text-[11px] leading-relaxed">
              n8n triggers headless Chromium to run axe-core &amp; Playwright journeys.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F4F5F7] border border-neutral-200/70 space-y-2">
            <div className="flex items-center gap-2 font-bold text-neutral-950">
              <span className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10px]">
                3
              </span>
              Safety Gate Logic
            </div>
            <p className="text-neutral-500 text-[11px] leading-relaxed">
              n8n evaluates task blocker counts and verifies allowlisted patch safety.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F4F5F7] border border-neutral-200/70 space-y-2">
            <div className="flex items-center gap-2 font-bold text-neutral-950">
              <span className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10px]">
                4
              </span>
              Status &amp; Receipts
            </div>
            <p className="text-neutral-500 text-[11px] leading-relaxed">
              n8n posts PR check-run status and alerts engineering channel with fix receipt.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Webhook Connectivity Tester */}
      <div className="p-6 sm:p-8 rounded-[24px] bg-[#F4F5F7] border border-neutral-200/80 space-y-5">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
            Webhook Connectivity Validation Tool
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            Test communication between AccessAble AI and your n8n webhook listener.
          </p>
        </div>

        <form onSubmit={handleTestConnection} className="space-y-4 max-w-2xl">
          <div>
            <label
              htmlFor="webhook-url-input"
              className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2"
            >
              n8n Webhook Endpoint URL
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                id="webhook-url-input"
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://n8n.example.com/webhook/accessable-pr-check"
                className="flex-1 px-4 py-2.5 rounded-full border border-neutral-300 bg-white text-xs font-mono text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 shadow-xs"
              />
              <button
                type="submit"
                disabled={testStatus === "testing"}
                className="px-6 py-2.5 rounded-full bg-neutral-950 text-white text-xs font-semibold hover:bg-neutral-800 disabled:opacity-50 transition-colors shrink-0 shadow-xs"
              >
                {testStatus === "testing" ? "Testing..." : "Test Webhook Ping"}
              </button>
              <button
                type="button"
                onClick={handleTestLocalEndpoint}
                disabled={testStatus === "testing"}
                className="px-5 py-2.5 rounded-full bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-900 text-xs font-semibold disabled:opacity-50 transition-colors shrink-0 shadow-xs"
              >
                Test Local Endpoint (/api/automation/webhook)
              </button>
            </div>
          </div>

          {/* Test Feedback Result */}
          {testStatus !== "idle" && (
            <div
              className={`p-4 rounded-xl text-xs flex items-start gap-2.5 border ${
                testStatus === "success"
                  ? "bg-emerald-50 text-emerald-950 border-emerald-200"
                  : testStatus === "failed" || testStatus === "unconfigured"
                  ? "bg-amber-50 text-amber-950 border-amber-200"
                  : "bg-neutral-100 text-neutral-800 border-neutral-200"
              }`}
            >
              <span className="font-bold shrink-0">
                {testStatus === "success"
                  ? "✓"
                  : testStatus === "testing"
                  ? "•"
                  : "!"}
              </span>
              <p className="leading-relaxed">{testMessage}</p>
            </div>
          )}
        </form>
      </div>

      {/* Downloadable / Copyable n8n Workflow JSON */}
      <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-neutral-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
              n8n Workflow Configuration Template
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Import this workflow into your n8n workspace to automate PR accessibility checks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyJson}
              className="px-4 py-2 rounded-full border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-900 text-xs font-semibold transition-colors shadow-xs"
            >
              {copied ? "Copied to Clipboard!" : "Copy Workflow JSON"}
            </button>
            <button
              type="button"
              onClick={handleDownloadJson}
              className="px-4 py-2 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              Download .json
            </button>
          </div>
        </div>

        <pre className="p-4 bg-neutral-950 text-neutral-200 rounded-xl text-xs font-mono overflow-x-auto max-h-72 whitespace-pre-wrap leading-relaxed">
          {JSON.stringify(SAMPLE_N8N_WORKFLOW, null, 2)}
        </pre>
      </div>

      {/* Required Environment Variables & Secrets Reference */}
      <div className="p-6 sm:p-8 rounded-[24px] bg-[#F4F5F7] border border-neutral-200/80 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
          Required Environment Variables &amp; Credentials
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-300/80 text-neutral-500 font-semibold uppercase">
                <th className="py-2.5 pr-4">Variable Name</th>
                <th className="py-2.5 px-4">Role &amp; Scope</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-neutral-800">
              <tr>
                <td className="py-3 pr-4 font-mono font-bold text-neutral-950">
                  N8N_WEBHOOK_SECRET
                </td>
                <td className="py-3 px-4">
                  HMAC / bearer secret verified by <code>/api/automation/webhook</code> on incoming webhooks.
                </td>
                <td className="py-3 px-4 text-emerald-700 font-semibold">
                  Supported (Optional)
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-mono font-bold text-neutral-950">
                  ACCESSABLE_API_URL
                </td>
                <td className="py-3 px-4">
                  Internal URL of the AccessAble AI instance (e.g.{" "}
                  <code>http://localhost:3000</code>).
                </td>
                <td className="py-3 px-4 text-emerald-700 font-semibold">
                  Default (Active)
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-mono font-bold text-neutral-950">
                  N8N_WEBHOOK_URL
                </td>
                <td className="py-3 px-4">
                  Target endpoint on your self-hosted or cloud n8n server.
                </td>
                <td className="py-3 px-4 text-neutral-500">Not Configured</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-mono font-bold text-neutral-950">
                  GITHUB_TOKEN
                </td>
                <td className="py-3 px-4">
                  GitHub Personal Access Token or App token with{" "}
                  <code>checks:write</code> permissions.
                </td>
                <td className="py-3 px-4 text-neutral-500">Optional</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-mono font-bold text-neutral-950">
                  SLACK_WEBHOOK_URL
                </td>
                <td className="py-3 px-4">
                  Incoming Slack webhook for accessibility regression notifications.
                </td>
                <td className="py-3 px-4 text-neutral-500">Optional</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
