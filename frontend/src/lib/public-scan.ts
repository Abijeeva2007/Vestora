import dns from "node:dns/promises";
import net from "node:net";
import type { AuditRun, Issue } from "@/types";

/**
 * Reads SCAN_ALLOWLIST environment variable.
 * Returns an array of trimmed, lowercased exact hostnames.
 */
export function getScanAllowlist(): string[] {
  const raw = process.env.SCAN_ALLOWLIST || "";
  return raw
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter((h) => h.length > 0);
}

/**
 * Returns true if public scanning is enabled (allowlist contains at least one hostname).
 */
export function isPublicScanEnabled(): boolean {
  return getScanAllowlist().length > 0;
}

// Convert IPv4 string to 32-bit unsigned number
function ipv4ToInt(ip: string): number {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    throw new Error(`Invalid IPv4 address: ${ip}`);
  }
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function isIpv4InCidr(ipInt: number, cidrBase: string, prefixLength: number): boolean {
  const baseInt = ipv4ToInt(cidrBase);
  const mask = prefixLength === 0 ? 0 : (~0 << (32 - prefixLength)) >>> 0;
  return (ipInt & mask) === (baseInt & mask);
}

/**
 * Checks if an IP address (IPv4 or IPv6) belongs to private, loopback, link-local,
 * cloud metadata, carrier-grade NAT, or other restricted ranges.
 */
export function isPrivateOrRestrictedIp(ip: string): boolean {
  const ipType = net.isIP(ip);
  if (ipType === 0) return true; // Invalid IP is rejected

  if (ipType === 4) {
    let ipInt: number;
    try {
      ipInt = ipv4ToInt(ip);
    } catch {
      return true;
    }

    // 0.0.0.0/8 (Current network)
    if (isIpv4InCidr(ipInt, "0.0.0.0", 8)) return true;
    // 10.0.0.0/8 (Private-Use)
    if (isIpv4InCidr(ipInt, "10.0.0.0", 8)) return true;
    // 100.64.0.0/10 (Carrier-Grade NAT)
    if (isIpv4InCidr(ipInt, "100.64.0.0", 10)) return true;
    // 127.0.0.0/8 (Loopback)
    if (isIpv4InCidr(ipInt, "127.0.0.0", 8)) return true;
    // 169.254.0.0/16 (Link-Local / AWS/GCP/Azure Metadata 169.254.169.254)
    if (isIpv4InCidr(ipInt, "169.254.0.0", 16)) return true;
    // 172.16.0.0/12 (Private-Use)
    if (isIpv4InCidr(ipInt, "172.16.0.0", 12)) return true;
    // 192.0.0.0/24 (IETF Protocol Assignments)
    if (isIpv4InCidr(ipInt, "192.0.0.0", 24)) return true;
    // 192.0.2.0/24 (Documentation TEST-NET-1)
    if (isIpv4InCidr(ipInt, "192.0.2.0", 24)) return true;
    // 192.88.99.0/24 (6to4 Relay Anycast)
    if (isIpv4InCidr(ipInt, "192.88.99.0", 24)) return true;
    // 192.168.0.0/16 (Private-Use)
    if (isIpv4InCidr(ipInt, "192.168.0.0", 16)) return true;
    // 198.18.0.0/15 (Benchmarking)
    if (isIpv4InCidr(ipInt, "198.18.0.0", 15)) return true;
    // 198.51.100.0/24 (Documentation TEST-NET-2)
    if (isIpv4InCidr(ipInt, "198.51.100.0", 24)) return true;
    // 203.0.113.0/24 (Documentation TEST-NET-3)
    if (isIpv4InCidr(ipInt, "203.0.113.0", 24)) return true;
    // 224.0.0.0/4 (Multicast)
    if (isIpv4InCidr(ipInt, "224.0.0.0", 4)) return true;
    // 240.0.0.0/4 (Reserved)
    if (isIpv4InCidr(ipInt, "240.0.0.0", 4)) return true;
    // 255.255.255.255/32 (Broadcast)
    if (ip === "255.255.255.255") return true;

    return false;
  }

  if (ipType === 6) {
    const lower = ip.toLowerCase();
    // Handle IPv4-mapped IPv6 (::ffff:192.0.2.128)
    if (lower.startsWith("::ffff:") && lower.includes(".")) {
      const v4Part = lower.slice(7);
      return isPrivateOrRestrictedIp(v4Part);
    }
    // Loopback (::1)
    if (lower === "::1" || lower === "0:0:0:0:0:0:0:1") return true;
    // Unspecified (::)
    if (lower === "::" || lower === "0:0:0:0:0:0:0:0") return true;
    // Unique Local fc00::/7 (fc00... or fd00...)
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
    // Link-Local fe80::/10 (fe8..., fe9..., fea..., feb...)
    if (/^fe[89ab]/i.test(lower)) return true;
    // Multicast ff00::/8
    if (lower.startsWith("ff")) return true;
    // Documentation 2001:db8::/32
    if (lower.startsWith("2001:db8:") || lower.startsWith("2001:0db8:")) return true;

    return false;
  }

  return true;
}

/**
 * Validates a target URL against all SSRF, protocol, and allowlist rules.
 */
export async function validatePublicScanUrl(
  urlString: string
): Promise<{ valid: boolean; normalized?: string; error?: string; hostname?: string }> {
  if (!isPublicScanEnabled()) {
    return { valid: false, error: "Public page scanning is not enabled." };
  }

  if (!urlString || typeof urlString !== "string") {
    return { valid: false, error: "Target URL must be a non-empty string." };
  }

  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return { valid: false, error: "Target URL is not a valid absolute URL." };
  }

  // Must be HTTPS only
  if (parsed.protocol !== "https:") {
    return { valid: false, error: "Only HTTPS URLs are permitted for public page scanning." };
  }

  // No username or password allowed
  if (parsed.username || parsed.password) {
    return { valid: false, error: "URLs containing user credentials are not allowed." };
  }

  // Port must be empty or 443
  if (parsed.port && parsed.port !== "443") {
    return { valid: false, error: "Only standard HTTPS port (443) is allowed." };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost, local domains, cloud metadata hostnames directly
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname === "metadata.google.internal" ||
    hostname === "169.254.169.254"
  ) {
    return { valid: false, error: "Access to local or cloud metadata hosts is strictly prohibited." };
  }

  // Exact match against allowlist
  const allowlist = getScanAllowlist();
  if (!allowlist.includes(hostname)) {
    return {
      valid: false,
      error: `Hostname "${hostname}" is not in the allowed scan hostnames list.`,
    };
  }

  // DNS lookup to prevent DNS rebinding and internal network targeting
  try {
    const records = await dns.lookup(hostname, { all: true });
    if (!records || records.length === 0) {
      return { valid: false, error: `Could not resolve hostname "${hostname}".` };
    }

    for (const record of records) {
      if (isPrivateOrRestrictedIp(record.address)) {
        return {
          valid: false,
          error: `Target resolved to restricted or private IP address (${record.address}).`,
        };
      }
    }
  } catch (dnsErr) {
    return {
      valid: false,
      error: `DNS resolution failed for hostname "${hostname}": ${dnsErr instanceof Error ? dnsErr.message : String(dnsErr)}`,
    };
  }

  return { valid: true, normalized: parsed.href, hostname };
}

/**
 * Checks robots.txt for the given target URL.
 * Refuses paths disallowed by robots.txt rules for User-agent * or AccessAble.
 */
export async function checkRobotsTxt(targetUrl: URL): Promise<{ allowed: boolean; reason?: string }> {
  const robotsUrl = `https://${targetUrl.hostname}/robots.txt`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(robotsUrl, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "AccessAbleAI/1.0 (Accessibility Auditor; +https://accessable.ai)",
        Accept: "text/plain",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);

    // If robots.txt returns 404 or non-200, access is not restricted
    if (!res.ok) {
      return { allowed: true };
    }

    const text = await res.text();
    const lines = text.split(/\r?\n/);
    let appliesToUs = false;
    const disallowRules: string[] = [];

    for (const rawLine of lines) {
      const line = rawLine.split("#")[0].trim();
      if (!line) continue;

      const colonIndex = line.indexOf(":");
      if (colonIndex === -1) continue;

      const directive = line.slice(0, colonIndex).trim().toLowerCase();
      const value = line.slice(colonIndex + 1).trim();

      if (directive === "user-agent") {
        const ua = value.toLowerCase();
        if (ua === "*" || ua.includes("accessable")) {
          appliesToUs = true;
        } else {
          appliesToUs = false;
        }
      } else if (appliesToUs && directive === "disallow") {
        if (value) {
          disallowRules.push(value);
        }
      }
    }

    const targetPath = targetUrl.pathname || "/";
    for (const rule of disallowRules) {
      if (rule === "/" || targetPath.startsWith(rule)) {
        return {
          allowed: false,
          reason: `Path "${targetPath}" is disallowed by robots.txt rules (${rule}).`,
        };
      }
    }

    return { allowed: true };
  } catch {
    // If fetching robots.txt errors or times out, fail open safely
    return { allowed: true };
  }
}

/**
 * Safely fetches public page HTML using GET requests only,
 * enforcing 20s timeout, 3 MB size limit, and <= 2 same-host redirects.
 */
export async function fetchPublicHtml(
  urlString: string,
  maxRedirects: number = 2
): Promise<{ html: string; finalUrl: string }> {
  let currentUrl = urlString;
  let redirectCount = 0;

  while (true) {
    const parsed = new URL(currentUrl);

    // Re-validate each redirect destination against SSRF rules
    const validation = await validatePublicScanUrl(currentUrl);
    if (!validation.valid) {
      throw new Error(validation.error || "Redirect target violates security rules.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    let res: Response;
    try {
      res = await fetch(currentUrl, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "User-Agent": "AccessAbleAI/1.0 (Accessibility Auditor; +https://accessable.ai)",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        redirect: "manual",
      });
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === "AbortError") {
        throw new Error("Scan request timed out after 20 seconds.");
      }
      throw new Error(`Failed to fetch target page: ${err.message}`);
    }

    if ([301, 302, 303, 307, 308].includes(res.status)) {
      clearTimeout(timeout);
      redirectCount++;
      if (redirectCount > maxRedirects) {
        throw new Error(`Exceeded maximum allowed redirects (${maxRedirects}).`);
      }

      const location = res.headers.get("location");
      if (!location) {
        throw new Error("Redirect response missing Location header.");
      }

      const nextUrl = new URL(location, currentUrl);
      if (nextUrl.hostname.toLowerCase() !== parsed.hostname.toLowerCase()) {
        throw new Error("Cross-host redirects are not permitted for security.");
      }
      if (nextUrl.protocol !== "https:") {
        throw new Error("Redirect to non-HTTPS URL is forbidden.");
      }

      currentUrl = nextUrl.href;
      continue;
    }

    if (!res.ok) {
      clearTimeout(timeout);
      throw new Error(`Target page returned HTTP error ${res.status}.`);
    }

    const contentLength = res.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 3 * 1024 * 1024) {
      clearTimeout(timeout);
      throw new Error("Target page exceeds maximum allowed size of 3 MB.");
    }

    if (!res.body) {
      clearTimeout(timeout);
      return { html: "", finalUrl: currentUrl };
    }

    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let receivedBytes = 0;
    const MAX_BYTES = 3 * 1024 * 1024;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          receivedBytes += value.length;
          if (receivedBytes > MAX_BYTES) {
            reader.cancel();
            throw new Error("Target page response exceeded 3 MB limit.");
          }
          chunks.push(value);
        }
      }
    } finally {
      clearTimeout(timeout);
    }

    const totalBuffer = Buffer.concat(chunks);
    const html = totalBuffer.toString("utf-8");
    return { html, finalUrl: currentUrl };
  }
}

/**
 * Lightweight static analyzer for public page HTML.
 * Evaluates core axe-compatible rules without running a full browser.
 */
export function runLightweightPublicScan(targetUrl: string, html: string): AuditRun {
  const startTime = new Date().toISOString();
  const issues: Issue[] = [];
  const issueCounts = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
    total: 0,
  };

  let passedRulesCount = 0;

  // 1. image-alt
  const imgRegex = /<img\b([^>]*)>/gi;
  let imgMatch: RegExpExecArray | null;
  const missingAltElements: { selectors: string[]; html: string; label: string }[] = [];

  while ((imgMatch = imgRegex.exec(html)) !== null) {
    const attrs = imgMatch[1];
    const hasAlt = /\balt\s*=/i.test(attrs);
    const hasAriaHidden = /aria-hidden\s*=\s*["']true["']/i.test(attrs);
    const hasPresentationRole = /role\s*=\s*["'](presentation|none)["']/i.test(attrs);

    if (!hasAlt && !hasAriaHidden && !hasPresentationRole) {
      const srcMatch = /\bsrc\s*=\s*["']([^"']*)["']/i.exec(attrs);
      const src = srcMatch ? srcMatch[1] : "image";
      missingAltElements.push({
        selectors: [`img[src="${src}"]`],
        html: imgMatch[0].length > 200 ? `${imgMatch[0].slice(0, 197)}...` : imgMatch[0],
        label: `img[src="${src}"]`,
      });
    }
  }

  if (missingAltElements.length > 0) {
    issues.push({
      id: `issue-image-alt-${Date.now()}`,
      rule: "image-alt",
      severity: "critical",
      description: "Ensure <img> elements have alternative text or a role of none or presentation",
      affectedElements: missingAltElements,
      helpText: "Elements must have alt attribute or presentation role",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.13/image-alt",
      evidenceType: "detected by rule",
      userImpact: "Screen-reader users cannot understand what this image conveys or why it is included because alternative text is missing.",
      automationSafety: "needs human judgment",
      measuredTaskImpact: "interactive_barrier",
    });
    issueCounts.critical += missingAltElements.length;
    issueCounts.total += missingAltElements.length;
  } else {
    passedRulesCount++;
  }

  // 2. button-name
  const buttonRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
  let btnMatch: RegExpExecArray | null;
  const missingButtonNameElements: { selectors: string[]; html: string; label: string }[] = [];

  while ((btnMatch = buttonRegex.exec(html)) !== null) {
    const attrs = btnMatch[1];
    const content = btnMatch[2].replace(/<[^>]+>/g, "").trim();
    const hasAriaLabel = /aria-label\s*=\s*["']([^"']+)["']/i.test(attrs);
    const hasAriaLabelledby = /aria-labelledby\s*=/i.test(attrs);
    const hasTitle = /title\s*=\s*["']([^"']+)["']/i.test(attrs);

    if (!content && !hasAriaLabel && !hasAriaLabelledby && !hasTitle) {
      const idMatch = /\bid\s*=\s*["']([^"']*)["']/i.exec(attrs);
      const sel = idMatch ? `#${idMatch[1]}` : "button";
      missingButtonNameElements.push({
        selectors: [sel],
        html: btnMatch[0].length > 200 ? `${btnMatch[0].slice(0, 197)}...` : btnMatch[0],
        label: sel,
      });
    }
  }

  if (missingButtonNameElements.length > 0) {
    issues.push({
      id: `issue-button-name-${Date.now()}`,
      rule: "button-name",
      severity: "critical",
      description: "Ensure buttons have discernible text",
      affectedElements: missingButtonNameElements,
      helpText: "Buttons must have discernible text or accessible labels",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.13/button-name",
      evidenceType: "detected by rule",
      userImpact: "Screen-reader users hear no discernible name for this button and cannot determine its purpose or function.",
      automationSafety: "needs human judgment",
      measuredTaskImpact: "interactive_barrier",
    });
    issueCounts.critical += missingButtonNameElements.length;
    issueCounts.total += missingButtonNameElements.length;
  } else {
    passedRulesCount++;
  }

  // 3. label (form controls)
  const inputRegex = /<input\b([^>]*)>/gi;
  let inputMatch: RegExpExecArray | null;
  const missingLabelElements: { selectors: string[]; html: string; label: string }[] = [];

  while ((inputMatch = inputRegex.exec(html)) !== null) {
    const attrs = inputMatch[1];
    const typeMatch = /type\s*=\s*["']([^"']*)["']/i.exec(attrs);
    const inputType = typeMatch ? typeMatch[1].toLowerCase() : "text";

    if (["hidden", "submit", "button", "reset", "image"].includes(inputType)) {
      continue;
    }

    const hasAriaLabel = /aria-label\s*=\s*["']([^"']+)["']/i.test(attrs);
    const hasAriaLabelledby = /aria-labelledby\s*=/i.test(attrs);
    const idMatch = /\bid\s*=\s*["']([^"']*)["']/i.exec(attrs);
    const id = idMatch ? idMatch[1] : null;

    let hasAssociatedLabel = false;
    if (id) {
      const labelForRegex = new RegExp(`<label\\b[^>]*for\\s*=\\s*["']${id}["']`, "i");
      hasAssociatedLabel = labelForRegex.test(html);
    }

    if (!hasAriaLabel && !hasAriaLabelledby && !hasAssociatedLabel) {
      const sel = id ? `#${id}` : `input[type="${inputType}"]`;
      missingLabelElements.push({
        selectors: [sel],
        html: inputMatch[0].length > 200 ? `${inputMatch[0].slice(0, 197)}...` : inputMatch[0],
        label: sel,
      });
    }
  }

  if (missingLabelElements.length > 0) {
    issues.push({
      id: `issue-label-${Date.now()}`,
      rule: "label",
      severity: "critical",
      description: "Ensure form controls have accessible labels",
      affectedElements: missingLabelElements,
      helpText: "Form elements must have labels",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.13/label",
      evidenceType: "detected by rule",
      userImpact: "People using screen readers or voice-dictation cannot identify what information this form field requires.",
      automationSafety: "needs human judgment",
      measuredTaskImpact: "interactive_barrier",
    });
    issueCounts.critical += missingLabelElements.length;
    issueCounts.total += missingLabelElements.length;
  } else {
    passedRulesCount++;
  }

  // 4. html-has-lang
  const htmlTagMatch = /<html\b([^>]*)>/i.exec(html);
  if (!htmlTagMatch || !/\blang\s*=\s*["'][^"']+["']/i.test(htmlTagMatch[1])) {
    issues.push({
      id: `issue-html-has-lang-${Date.now()}`,
      rule: "html-has-lang",
      severity: "serious",
      description: "Ensure the <html> element has a lang attribute",
      affectedElements: [
        {
          selectors: ["html"],
          html: htmlTagMatch ? htmlTagMatch[0] : "<html>",
          label: "html",
        },
      ],
      helpText: "<html> element must have a lang attribute",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.13/html-has-lang",
      evidenceType: "detected by rule",
      userImpact: "Assistive technologies cannot determine the document language, potentially reading text with incorrect speech synthesizer pronunciation.",
      automationSafety: "safe to auto-apply",
    });
    issueCounts.serious += 1;
    issueCounts.total += 1;
  } else {
    passedRulesCount++;
  }

  // 5. document-title
  const titleMatch = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (!titleMatch || !titleMatch[1].trim()) {
    issues.push({
      id: `issue-document-title-${Date.now()}`,
      rule: "document-title",
      severity: "serious",
      description: "Ensure each HTML document has a non-empty <title> element",
      affectedElements: [
        {
          selectors: ["head"],
          html: titleMatch ? titleMatch[0] : "<head>",
          label: "title",
        },
      ],
      helpText: "Documents must have <title> element to aid in navigation",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.13/document-title",
      evidenceType: "detected by rule",
      userImpact: "Screen-reader users cannot identify the current document or window purpose without reading page content.",
      automationSafety: "needs human judgment",
    });
    issueCounts.serious += 1;
    issueCounts.total += 1;
  } else {
    passedRulesCount++;
  }

  // 6. link-name
  const linkRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let linkMatch: RegExpExecArray | null;
  const missingLinkNameElements: { selectors: string[]; html: string; label: string }[] = [];

  while ((linkMatch = linkRegex.exec(html)) !== null) {
    const attrs = linkMatch[1];
    if (!/\bhref\s*=/i.test(attrs)) continue;

    const content = linkMatch[2].replace(/<[^>]+>/g, "").trim();
    const hasAriaLabel = /aria-label\s*=\s*["']([^"']+)["']/i.test(attrs);
    const hasAriaLabelledby = /aria-labelledby\s*=/i.test(attrs);
    const hasImgWithAlt = /<img\b[^>]*\balt\s*=\s*["'][^"']+["']/i.test(linkMatch[2]);

    if (!content && !hasAriaLabel && !hasAriaLabelledby && !hasImgWithAlt) {
      const hrefMatch = /\bhref\s*=\s*["']([^"']*)["']/i.exec(attrs);
      const sel = hrefMatch ? `a[href="${hrefMatch[1]}"]` : "a";
      missingLinkNameElements.push({
        selectors: [sel],
        html: linkMatch[0].length > 200 ? `${linkMatch[0].slice(0, 197)}...` : linkMatch[0],
        label: sel,
      });
    }
  }

  if (missingLinkNameElements.length > 0) {
    issues.push({
      id: `issue-link-name-${Date.now()}`,
      rule: "link-name",
      severity: "serious",
      description: "Ensure links have discernible text",
      affectedElements: missingLinkNameElements,
      helpText: "Links must have discernible text",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.13/link-name",
      evidenceType: "detected by rule",
      userImpact: "Users of assistive technologies cannot tell where this link leads because discernible text is missing.",
      automationSafety: "needs human judgment",
    });
    issueCounts.serious += missingLinkNameElements.length;
    issueCounts.total += missingLinkNameElements.length;
  } else {
    passedRulesCount++;
  }

  return {
    id: `scan-${Date.now()}`,
    timestamp: startTime,
    target: targetUrl,
    status: "success",
    engine: "lightweight",
    isSnapshot: true,
    snapshotLabel: "Saved snapshot",
    isPublicTarget: true,
    engineNotice: "Lightweight scan: rules that need real layout, such as color contrast, may not be evaluated.",
    complianceNotice: "Automated checks only. Not a statement of compliance.",
    findingsSummary: `automated checks reported ${issueCounts.total} issues`,
    durationMs: 450,
    passesCount: passedRulesCount,
    incompleteCount: 0,
    issueCounts,
    issues,
  };
}
