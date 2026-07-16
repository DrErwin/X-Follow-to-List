(function installXPageHook() {
  if (window.__xFollowingCuratorHookInstalled) return;
  window.__xFollowingCuratorHookInstalled = true;

  const SOURCE = "x-list-curator";
  const GRAPHQL_RE = /\/i\/api\/graphql\//i;
  const FOLLOWING_RE = /following|friends|userfollow/i;
  const ADD_ENDPOINT = "https://x.com/i/api/graphql/EQ9KOQeashjfWnwFvcSSpg/ListAddMember";
  const session = {
    authorization: "",
    csrf: "",
    transaction: "",
    activeUser: "yes",
    authType: "OAuth2Session",
    fingerprint: ""
  };
  const capturedUsers = new Map();
  let captureGeneration = 0;

  function post(kind, detail) {
    window.postMessage({ source: SOURCE, ...(detail || {}), kind }, "*");
  }

  async function refreshSessionFingerprint() {
    const cookie = document.cookie.match(/(?:^|;\s*)ct0=([^;]+)/)?.[1] || "";
    if (!cookie) return;
    try {
      const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(decodeURIComponent(cookie)));
      session.fingerprint = Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
      post("X_SESSION_READY", { ready: Boolean(session.authorization), fingerprint: session.fingerprint });
    } catch (_) {}
  }

  function emitUsers(users, url, generation = captureGeneration) {
    if (generation !== captureGeneration) return;
    for (const user of users || []) {
      if (user?.id) capturedUsers.set(String(user.id), user);
    }
    const compact = Array.from(capturedUsers.values()).slice(-5000);
    post("X_USERS", { users, url, total: compact.length, captureGeneration });
  }

  function headerEntries(headers) {
    if (!headers) return [];
    try {
      if (headers instanceof Headers) return Array.from(headers.entries());
      if (Array.isArray(headers)) return headers;
      return Object.entries(headers);
    } catch (_) {
      return [];
    }
  }

  function inspectRequest(input, init) {
    const entries = [
      ...headerEntries(input instanceof Request ? input.headers : null),
      ...headerEntries(init?.headers)
    ];
    for (const [key, value] of entries) {
      const name = String(key).toLowerCase();
      if (name === "authorization" && value) session.authorization = String(value);
      if (name === "x-csrf-token" && value) session.csrf = String(value);
      if (name === "x-client-transaction-id" && value) session.transaction = String(value);
      if (name === "x-twitter-active-user" && value) session.activeUser = String(value);
      if (name === "x-twitter-auth-type" && value) session.authType = String(value);
    }
    const cookie = document.cookie.match(/(?:^|;\s*)ct0=([^;]+)/)?.[1];
    if (cookie) session.csrf = decodeURIComponent(cookie);
    if (session.authorization || session.csrf) refreshSessionFingerprint();
  }

  function text(value) {
    return value == null ? "" : String(value);
  }

  function getId(obj) {
    return text(obj?.rest_id || obj?.id_str || obj?.id || obj?.user_id);
  }

  function getLegacy(obj) {
    return obj?.legacy || obj?.user_results?.result?.legacy || obj;
  }

  function getHandle(obj) {
    const legacy = getLegacy(obj);
    return text(obj?.core?.screen_name || legacy?.screen_name || obj?.screen_name || obj?.username);
  }

  function getName(obj) {
    const legacy = getLegacy(obj);
    return text(obj?.core?.name || legacy?.name || obj?.name);
  }

  function getAvatar(obj) {
    const legacy = getLegacy(obj);
    return text(obj?.avatar?.image_url || obj?.profile_image_url_https || legacy?.profile_image_url_https);
  }

  function looksLikeUser(obj) {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
    const id = getId(obj);
    const handle = getHandle(obj);
    return Boolean(id && handle && (obj.legacy || obj.core || obj.profile_image_url_https || obj.user_results));
  }

  function extractUsers(payload) {
    const found = [];
    const seen = new Set();
    const walk = (node, depth) => {
      if (!node || depth > 18 || typeof node !== "object") return;
      if (Array.isArray(node)) {
        for (const child of node) walk(child, depth + 1);
        return;
      }
      if (looksLikeUser(node)) {
        const id = getId(node);
        if (!seen.has(id)) {
          seen.add(id);
          const legacy = getLegacy(node);
          found.push({
            id,
            handle: getHandle(node),
            name: getName(node),
            bio: text(node?.profile_bio?.description || legacy?.description || node?.description),
            location: text(legacy?.location || node?.location),
            avatar: getAvatar(node),
            followers: Number(legacy?.followers_count ?? node?.public_metrics?.followers_count ?? 0) || 0,
            following: Number(legacy?.friends_count ?? node?.public_metrics?.following_count ?? 0) || 0,
            posts: Number(legacy?.statuses_count ?? node?.public_metrics?.tweet_count ?? 0) || 0,
            verified: Boolean(node?.verification?.verified || legacy?.verified || legacy?.is_blue_verified),
            protected: Boolean(legacy?.protected || node?.protected),
            mutual: Boolean(
              node?.relationship_perspectives?.followed_by ||
              node?.relationship?.source?.followed_by ||
              node?.relationship?.followed_by ||
              legacy?.followed_by
            ),
            capturedAt: Date.now()
          });
        }
      }
      for (const value of Object.values(node)) walk(value, depth + 1);
    };
    walk(payload, 0);
    return found;
  };

  function isRelevantUrl(url) {
    // Do not use the page path as a fallback here. X issues many unrelated
    // GraphQL requests while its Following page is open (profiles, suggestions,
    // lists, prefetches, etc.), and their user objects are not followed accounts.
    return GRAPHQL_RE.test(url || "") && FOLLOWING_RE.test(url || "");
  }

  function wrapFetch() {
    const originalFetch = window.fetch;
    window.fetch = async function patchedFetch(input, init) {
      const url = typeof input === "string" ? input : input?.url || "";
      inspectRequest(input, init);
      const response = await originalFetch.apply(this, arguments);
      if (isRelevantUrl(url)) {
        const requestGeneration = captureGeneration;
        response.clone().json().then((payload) => {
          const users = extractUsers(payload);
          if (users.length) emitUsers(users, url, requestGeneration);
        }).catch(() => {});
      }
      return response;
    };
  }

  function wrapXhr() {
    const open = XMLHttpRequest.prototype.open;
    const send = XMLHttpRequest.prototype.send;
    const setHeader = XMLHttpRequest.prototype.setRequestHeader;
    XMLHttpRequest.prototype.open = function patchedOpen(method, url) {
      this.__xCuratorUrl = String(url || "");
      return open.apply(this, arguments);
    };
    XMLHttpRequest.prototype.setRequestHeader = function patchedSetHeader(name, value) {
      const key = String(name).toLowerCase();
      if (key === "authorization") session.authorization = String(value);
      if (key === "x-csrf-token") session.csrf = String(value);
      if (key === "x-client-transaction-id") session.transaction = String(value);
      return setHeader.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function patchedSend() {
      const url = this.__xCuratorUrl || "";
      if (isRelevantUrl(url)) {
        const requestGeneration = captureGeneration;
        this.addEventListener("load", () => {
          try {
            const users = extractUsers(JSON.parse(this.responseText));
            if (users.length) emitUsers(users, url, requestGeneration);
          } catch (_) {}
        });
      }
      inspectRequest(null, { headers: { "x-csrf-token": document.cookie.match(/(?:^|;\s*)ct0=([^;]+)/)?.[1] || "" } });
      return send.apply(this, arguments);
    };
  }

  async function addMember({ requestId, listId, userId }) {
    const startedAt = Date.now();
    const csrf = session.csrf || document.cookie.match(/(?:^|;\s*)ct0=([^;]+)/)?.[1] || "";
    const headers = {
      accept: "*/*",
      "content-type": "application/json",
      "x-csrf-token": decodeURIComponent(csrf),
      "x-twitter-active-user": session.activeUser || "yes",
      "x-twitter-auth-type": session.authType || "OAuth2Session"
    };
    if (session.authorization) headers.authorization = session.authorization;
    if (session.transaction) headers["x-client-transaction-id"] = session.transaction;
    const body = {
      variables: { listId: String(listId), userId: String(userId) },
      features: {
        graphql_timeline_v2_bookmark_timeline: true,
        responsive_web_graphql_exclude_directive_enabled: true,
        verified_backsplash_enabled: true,
        responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
        longform_notetweets_rich_text_read_enabled: true
      }
    };
    try {
      const response = await fetch(ADD_ENDPOINT, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify(body)
      });
      const raw = await response.text();
      let parsed = null;
      try { parsed = JSON.parse(raw); } catch (_) {}
      const errors = Array.isArray(parsed?.errors) ? parsed.errors : [];
      const errorMessages = errors.map((error) => String(error?.message || "")).filter(Boolean).slice(0, 3);
      const errorCodes = errors.map((error) => String(error?.code ?? error?.extensions?.code ?? "")).filter(Boolean).slice(0, 3);
      const errorPaths = errors.map((error) => Array.isArray(error?.path) ? error.path.join(".") : "").filter(Boolean).slice(0, 3);
      const responseShape = parsed?.data && typeof parsed.data === "object" ? Object.keys(parsed.data).slice(0, 12).join("|") : "";
      const listData = parsed?.data?.list;
      const hasListData = Boolean(listData && typeof listData === "object" && (listData.id || listData.id_str || listData.member_count != null || listData.members_context));
      const auxiliaryOnly = errors.length > 0 && errors.every((error) => {
        const path = Array.isArray(error?.path) ? error.path.join(".") : "";
        return path === "list.default_banner_media_results.result" || path.includes("default_banner_media");
      });
      const errorText = errorMessages.join(" ").toLowerCase();
      let kind = "failed";
      if (response.ok && hasListData && (errors.length === 0 || auxiliaryOnly)) kind = "succeeded";
      else if (response.ok && /already[\s_-]*(a\s+)?member|already\s+in\s+(the\s+)?list|duplicate/.test(errorText)) kind = "already_member";
      else if (response.ok && parsed?.data && !errors.length) kind = "succeeded";
      const retryable = response.status === 400 || response.status === 403 || response.status === 429 || response.status >= 500;
      post("X_ADD_RESULT", {
        requestId,
        ok: kind === "succeeded" || kind === "already_member",
        resultKind: kind,
        retryable,
        status: response.status,
        message: errorMessages[0] || (kind === "failed" ? raw.slice(0, 240) : ""),
        errorCode: errorCodes[0] || "",
        errorPath: errorPaths[0] || "",
        responseShape,
        durationMs: Date.now() - startedAt
      });
    } catch (error) {
      post("X_ADD_RESULT", { requestId, ok: false, resultKind: "failed", retryable: true, status: 0, message: error?.message || "network error", errorCode: "NETWORK", errorPath: "", responseShape: "", durationMs: Date.now() - startedAt });
    }
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window || event.data?.source !== SOURCE) return;
    if (event.data.kind === "ADD_MEMBER") addMember(event.data);
    if (event.data.kind === "REQUEST_SNAPSHOT") {
      post("X_SNAPSHOT", { users: Array.from(capturedUsers.values()).slice(-5000), captureGeneration });
      if (session.authorization || session.csrf) refreshSessionFingerprint();
    }
    if (event.data.kind === "CLEAR_CAPTURED_USERS") {
      capturedUsers.clear();
      captureGeneration += 1;
      post("X_CAPTURE_CLEARED", { captureGeneration });
      post("X_SNAPSHOT", { users: [], captureGeneration });
    }
  });

  wrapFetch();
  wrapXhr();
  post("X_HOOK_READY", { ready: true });
})();
