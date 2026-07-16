(function installCuratorPanel() {
  const SOURCE = "x-list-curator";
  const STORAGE_KEY = "x-list-curator-state-v1";
  const MAX_USERS = 5000;
  const ROW_HEIGHT = 88;
  const VISIBLE_ROWS = 14;
  const DEFAULT_SETTINGS = {
    betweenMin: 2,
    betweenMax: 6,
    batchSize: 20,
    pauseMin: 2,
    pauseMax: 5,
    maxAttempts: 2
  };
  const DEFAULT_FILTERS = {
    query: "",
    include: "",
    exclude: "",
    location: "",
    minFollowers: "",
    maxFollowers: "",
    minFollowing: "",
    maxFollowing: "",
    minPosts: "",
    maxPosts: "",
    mutual: false
  };

  const state = {
    schemaVersion: 1,
    users: [],
    selectedIds: [],
    filters: { ...DEFAULT_FILTERS },
    filterDraft: { ...DEFAULT_FILTERS },
    listUrl: "",
    settings: { ...DEFAULT_SETTINGS },
    job: null,
    history: [],
    sessionFingerprint: ""
  };
  const runtime = {
    panelOpen: false,
    running: false,
    stopRequested: false,
    cooldownTimer: 0,
    cooldownTicker: 0,
    filteredUsers: [],
    sessionReady: false,
    sessionFingerprint: "",
    hookReady: false,
    persistTimer: 0,
    toastTimer: 0,
    pendingAdds: new Map(),
    storageCorrupt: false,
    captureGeneration: 0,
    captureClearPending: false
  };
  const refs = {};

  const css = `
    :host { all: initial; }
    * { box-sizing: border-box; }
    .xcurator-panel { position: fixed; z-index: 2147483647; top: 16px; right: 16px; width: min(470px, calc(100vw - 32px)); max-height: calc(100vh - 32px); overflow: hidden; color: #eff6f0; background: #101817; border: 1px solid #2d4941; border-radius: 18px; box-shadow: 0 22px 70px rgba(0,0,0,.46); font: 13px/1.4 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .xcurator-panel[hidden] { display: none; }
    .xcurator-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 18px 20px 14px; border-bottom: 1px solid #203730; background: linear-gradient(135deg, #14231f, #101817 68%); }
    .header-actions { display: flex; align-items: center; gap: 8px; margin-left: 12px; flex: 0 0 auto; }
    .clear-capture { min-height: 30px; padding: 5px 9px; border: 1px solid #705541; border-radius: 8px; color: #f0c88d; background: rgba(122, 75, 38, .14); font-size: 11px; font-weight: 700; white-space: nowrap; }
    .clear-capture:hover:not(:disabled) { color: #fff1d3; border-color: #c08b57; background: rgba(151, 91, 45, .28); }
    .eyebrow { color: #a8d8b2; letter-spacing: .18em; font-size: 10px; font-weight: 700; }
    h1 { margin: 3px 0 0; color: #f5f1dc; font: 600 23px/1.1 Georgia, Cambria, serif; letter-spacing: -.02em; }
    .close { width: 30px; height: 30px; border: 0; border-radius: 50%; color: #b7cbc0; background: #1c302a; cursor: pointer; font-size: 18px; }
    .close:hover { color: #fff; background: #315246; }
    .xcurator-body { display: flex; flex-direction: column; max-height: calc(100vh - 101px); overflow: auto; }
    .section { padding: 14px 20px; border-bottom: 1px solid #203730; }
    .section-title { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 9px; color: #f4f0dd; font-weight: 700; }
    .muted { color: #8ea99c; }
    .status-line { display: flex; gap: 8px; align-items: center; padding: 8px 10px; color: #c5d5cc; background: #15241f; border-radius: 9px; }
    .dot { width: 7px; height: 7px; border-radius: 50%; background: #e29a55; flex: 0 0 auto; }
    .dot.ready { background: #91e6a8; box-shadow: 0 0 0 3px rgba(145,230,168,.12); }
    .notice { margin-top: 9px; padding: 9px 10px; color: #e9c68b; background: rgba(159, 96, 36, .14); border: 1px solid rgba(223, 158, 81, .26); border-radius: 9px; font-size: 11px; }
    .risk-inline { color: #e9c68b; font-weight: 700; }
    label.field { display: block; color: #9eb8aa; font-size: 11px; }
    label.field span { display: block; margin-bottom: 5px; }
    input[type=text], input[type=number] { width: 100%; min-height: 34px; padding: 7px 9px; border: 1px solid #355448; border-radius: 8px; color: #eef5ef; background: #0d1514; outline: none; font: inherit; }
    input[type=text]:focus, input[type=number]:focus { border-color: #8edca5; box-shadow: 0 0 0 2px rgba(142,220,165,.12); }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }
    .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
    .filter-grid { display: grid; gap: 9px; }
    .metric-ranges { display: grid; gap: 7px; }
    .metric-range { display: grid; grid-template-columns: 46px minmax(0, 1fr); gap: 9px; align-items: end; padding: 8px; border: 1px solid #28453b; border-radius: 9px; background: rgba(10, 23, 19, .38); }
    .metric-name { padding-bottom: 7px; color: #b4cabd; font-size: 10px; font-weight: 800; letter-spacing: .04em; }
    .metric-range label.field span { font-size: 10px; }
    .relationship-filter { display: inline-flex; align-items: center; gap: 7px; min-height: 32px; padding: 6px 10px; border: 1px solid #315246; border-radius: 8px; color: #c8dacd; background: #12211c; font-size: 11px; cursor: pointer; }
    .relationship-filter input { accent-color: #98e6aa; }
    .relationship-filter .relationship-mark { color: #9ae5a6; font-size: 15px; line-height: 1; }
    .relationship-filter small { color: #7e9a8d; font-size: 10px; }
    .filter-apply-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 10px; padding-top: 9px; border-top: 1px solid #203730; }
    .filter-commit { display: inline-flex; align-items: center; gap: 8px; }
    .match-count { color: #a6c7ae; font-size: 11px; white-space: nowrap; }
    .match-count.pending { color: #e2c58c; }
    button.filter-reset { color: #9eb8aa; background: transparent; }
    button.filter-apply { min-height: 32px; padding-inline: 13px; color: #102018; background: #9ae5a6; border-color: #9ae5a6; font-weight: 800; }
    button.filter-apply:hover { background: #b1f1b7; }
    .selection-panel { margin-top: 12px; padding: 10px; border: 1px solid #2d4d42; border-radius: 10px; background: #102019; }
    .selection-panel-head { display: flex; justify-content: space-between; align-items: end; gap: 8px; }
    .selection-panel-head strong { display: block; margin-top: 1px; color: #f4f0dd; font-size: 13px; }
    .panel-kicker { color: #86a99a; font-size: 9px; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; }
    .selection-scope { color: #8aa89a; font-size: 10px; white-space: nowrap; }
    .selection-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; margin-top: 9px; }
    .selection-actions button { min-height: 35px; padding-inline: 7px; }
    .selection-actions .selection-export { color: #b9dcc1; border-color: #4d7862; background: #142a20; }
    button { min-height: 31px; padding: 6px 10px; border: 1px solid #395a4e; border-radius: 8px; color: #c7d8ce; background: #15241f; cursor: pointer; font: 600 11px/1.1 inherit; }
    button:hover { border-color: #90dca4; color: #f6fff8; }
    button:disabled { opacity: .42; cursor: not-allowed; }
    button.primary { width: 100%; margin-top: 10px; border-color: #a3e9ad; color: #092216; background: #9ae5a6; font-size: 13px; }
    button.primary:hover { background: #b1f1b7; }
    button.danger { color: #efb3a4; }
    .list-viewport { height: 342px; overflow: auto; border: 1px solid #29463d; border-radius: 10px; background: #0c1413; }
    .list-row { display: grid; grid-template-columns: 21px 44px minmax(0, 1fr); gap: 9px; align-items: center; min-height: ${ROW_HEIGHT}px; padding: 8px 10px; border-bottom: 1px solid #1a2a26; }
    .list-row:last-child { border-bottom: 0; }
    .list-row:hover { background: #12231d; }
    .row-check { accent-color: #98e6aa; }
    .avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; background: #274238; border: 1px solid #45675a; }
    .user-main { min-width: 0; }
    .user-name { display: flex; gap: 5px; align-items: center; min-width: 0; color: #f4f2e6; font-weight: 700; }
    .user-name strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .badge { color: #92e6a5; font-size: 11px; }
    .handle { color: #87a99a; font-size: 11px; }
    .bio { display: -webkit-box; overflow: hidden; margin-top: 2px; color: #b1c5b9; font-size: 11px; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
    .metrics { margin-top: 3px; color: #789588; font-size: 10px; }
    .empty { display: grid; place-items: center; height: 100%; padding: 20px; color: #819a8e; text-align: center; }
    .selection-hint { margin-top: 7px; color: #86a294; font-size: 10px; }
    details { margin-top: 10px; border: 1px solid #28453b; border-radius: 9px; }
    summary { padding: 8px 10px; color: #a4bdaf; cursor: pointer; font-size: 11px; }
    .advanced { display: grid; gap: 9px; padding: 2px 10px 11px; }
    .job-card { padding: 10px; border: 1px solid #315246; border-radius: 10px; background: #12211c; }
    .job-head { display: flex; justify-content: space-between; gap: 8px; color: #dae9df; font-weight: 700; }
    .progress-track { height: 7px; margin: 9px 0 6px; overflow: hidden; border-radius: 99px; background: #263c34; }
    .progress-fill { height: 100%; width: 0%; border-radius: inherit; background: #9ae5a6; transition: width .2s ease; }
    .job-meta { display: flex; justify-content: space-between; color: #8faa9c; font-size: 10px; }
    .job-action-groups { display: grid; grid-template-columns: minmax(0, 2fr) minmax(126px, 1fr); gap: 8px; margin-top: 10px; }
    .job-action-group { padding: 8px; border: 1px solid #2d4d42; border-radius: 9px; background: rgba(8, 21, 17, .42); }
    .job-action-group-label { margin: 0 0 7px; color: #86a99a; font-size: 9px; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; }
    .job-action-grid { display: grid; gap: 6px; }
    .job-action-group.flow .job-action-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .job-action-group.export .job-action-grid { grid-template-columns: minmax(0, 1fr); }
    .job-action-group button { min-height: 37px; padding-inline: 7px; }
    .history-list { display: grid; gap: 7px; max-height: 220px; overflow: auto; }
    .history-item { padding: 8px 9px; border: 1px solid #29463d; border-radius: 8px; background: #0d1715; }
    .history-item strong { color: #e9f0e8; }
    .history-item .history-meta { margin-top: 3px; color: #87a294; font-size: 10px; }
    .history-item .history-actions { display: flex; gap: 6px; margin-top: 6px; }
    .toast { position: fixed; right: 18px; bottom: 18px; max-width: 360px; padding: 10px 12px; color: #07170e; background: #a3e9ad; border-radius: 9px; box-shadow: 0 10px 30px rgba(0,0,0,.3); font-weight: 700; }
    @media (max-width: 560px) { .xcurator-panel { top: 8px; right: 8px; width: calc(100vw - 16px); max-height: calc(100vh - 16px); } .xcurator-body { max-height: calc(100vh - 87px); } .job-action-groups { grid-template-columns: 1fr; } .job-action-group.export .job-action-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .metric-range { grid-template-columns: 1fr; gap: 5px; } .metric-name { padding-bottom: 0; } .relationship-filter small { display: none; } }
  `;

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, Number(value) || min));
  }

  function splitTerms(value) {
    return String(value || "").split(/[\s,，、]+/).map((term) => term.trim().toLowerCase()).filter(Boolean);
  }

  function normalizeUser(raw) {
    const id = String(raw?.id || raw?.rest_id || raw?.id_str || "").trim();
    const handle = String(raw?.handle || raw?.screen_name || "").replace(/^@/, "").trim();
    if (!id || !handle) return null;
    return {
      id,
      handle,
      name: String(raw?.name || handle).trim(),
      bio: String(raw?.bio || "").trim(),
      location: String(raw?.location || "").trim(),
      avatar: String(raw?.avatar || "").trim(),
      followers: Number(raw?.followers || 0) || 0,
      following: Number(raw?.following || 0) || 0,
      posts: Number(raw?.posts || 0) || 0,
      verified: Boolean(raw?.verified),
      protected: Boolean(raw?.protected),
      mutual: Boolean(raw?.mutual),
      capturedAt: Number(raw?.capturedAt || Date.now())
    };
  }

  function parseListUrl(value) {
    try {
      const url = new URL(String(value).trim());
      if (!/(^|\.)x\.com$|(^|\.)twitter\.com$/i.test(url.hostname)) return null;
      const match = url.pathname.match(/\/i\/lists\/(\d+)|\/lists\/(\d+)/i);
      if (!match) return null;
      return { id: match[1] || match[2], url: url.toString() };
    } catch (_) {
      return null;
    }
  }

  function isFollowingPage() {
    return /(?:^|\/)(following|friends)(?:\/|$)/i.test(location.pathname) || /following/i.test(document.title);
  }

  function selectedSet() {
    return new Set(state.selectedIds);
  }

  function currentSettings() {
    const read = (name, fallback) => Number(refs[name]?.value ?? fallback);
    const min = clamp(read("betweenMin", DEFAULT_SETTINGS.betweenMin), 1, 60);
    const max = clamp(read("betweenMax", DEFAULT_SETTINGS.betweenMax), min, 120);
    return {
      betweenMin: min,
      betweenMax: max,
      batchSize: clamp(read("batchSize", DEFAULT_SETTINGS.batchSize), 1, 500),
      pauseMin: clamp(read("pauseMin", DEFAULT_SETTINGS.pauseMin), 0.1, 60),
      pauseMax: clamp(read("pauseMax", DEFAULT_SETTINGS.pauseMax), clamp(read("pauseMin", DEFAULT_SETTINGS.pauseMin), 0.1, 60), 120),
      maxAttempts: clamp(read("maxAttempts", DEFAULT_SETTINGS.maxAttempts), 1, 5)
    };
  }

  function randomBetween(min, max) {
    return min + Math.random() * Math.max(0, max - min);
  }

  async function sha256Hex(value) {
    const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(value)));
    return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  async function queueFingerprint(listId, ids) {
    return sha256Hex(`${listId}|${ids.join(",")}`);
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString("zh-CN");
  }

  function formatDuration(ms) {
    const seconds = Math.max(0, Math.ceil(ms / 1000));
    if (seconds < 60) return `${seconds} 秒`;
    return `${Math.ceil(seconds / 60)} 分钟`;
  }

  function jobStatusLabel(status) {
    return ({ draft: "待开始", running: "导入中", paused: "已暂停", cooldown: "冷却中", completed: "已完成" }[status]) || status || "无任务";
  }

  function itemStatusLabel(status) {
    return ({ pending: "待处理", retryable: "等待重试", succeeded: "已加入", already_member: "已在列表", failed: "失败", skipped: "跳过" }[status]) || status;
  }

  function recomputeJobStats(job) {
    if (!job?.queue) return;
    job.successCount = job.queue.filter((item) => item.status === "succeeded").length;
    job.alreadyCount = job.queue.filter((item) => item.status === "already_member").length;
    job.failureCount = job.queue.filter((item) => item.status === "failed").length;
  }

  async function persistNow() {
    recomputeJobStats(state.job);
    state.job && (state.job.updatedAt = Date.now());
    try {
      await globalThis.XListStore.save(state);
    } catch (error) {
      showToast(`本地保存失败：${error?.message || "storage error"}`);
    }
  }

  function persistSoon() {
    clearTimeout(runtime.persistTimer);
    runtime.persistTimer = setTimeout(() => persistNow(), 180);
  }

  function showToast(message) {
    if (!refs.toast) return;
    refs.toast.textContent = message;
    refs.toast.hidden = false;
    clearTimeout(runtime.toastTimer);
    runtime.toastTimer = setTimeout(() => { refs.toast.hidden = true; }, 3500);
  }

  function createUi() {
    const host = document.createElement("div");
    host.id = "x-following-curator-host";
    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <style>${css}</style>
      <section class="xcurator-panel" hidden aria-label="X Following Curator">
        <header class="xcurator-header">
          <div><div class="eyebrow">X FOLLOW TO LIST · 0.1.8</div><h1>把关注列表变成你的清单</h1></div>
          <div class="header-actions"><button class="clear-capture" data-ref="clearCaptured" data-action="clearCaptured" title="清除本地已捕获账号和勾选状态，不影响导入任务">清除已捕获</button><button class="close" data-action="close" title="关闭">×</button></div>
        </header>
        <div class="xcurator-body">
          <section class="section">
            <div class="status-line"><span class="dot" data-ref="sessionDot"></span><span data-ref="pageStatus">正在等待 X 页面数据…</span></div>
            <div class="notice">此扩展使用当前 X 网页会话发起列表操作。X 可能限制或暂停自动化行为；请仅添加你明确选择的账号，并自行承担账号与平台规则风险。</div>
          </section>
          <section class="section">
            <div class="section-title"><span>筛选条件</span><span class="muted" data-ref="captureCount">已捕获 0 人</span></div>
            <div class="filter-grid">
              <label class="field"><span>搜索姓名、@用户名、简介或位置</span><input type="text" data-ref="query" placeholder="例如：design / 设计 / @alice"></label>
              <div class="grid2"><label class="field"><span>包含关键词</span><input type="text" data-ref="include" placeholder="空格分隔"></label><label class="field"><span>排除关键词</span><input type="text" data-ref="exclude" placeholder="空格分隔"></label></div>
              <label class="field"><span>位置关键词</span><input type="text" data-ref="location" placeholder="例如：Shanghai / Hong Kong"></label>
              <div class="metric-ranges">
                <div class="metric-range"><span class="metric-name">粉丝数</span><div class="grid2"><label class="field"><span>最少</span><input type="number" min="0" data-ref="minFollowers" placeholder="不限"></label><label class="field"><span>最多</span><input type="number" min="0" data-ref="maxFollowers" placeholder="不限"></label></div></div>
                <div class="metric-range"><span class="metric-name">关注数</span><div class="grid2"><label class="field"><span>最少</span><input type="number" min="0" data-ref="minFollowing" placeholder="不限"></label><label class="field"><span>最多</span><input type="number" min="0" data-ref="maxFollowing" placeholder="不限"></label></div></div>
                <div class="metric-range"><span class="metric-name">发帖数</span><div class="grid2"><label class="field"><span>最少</span><input type="number" min="0" data-ref="minPosts" placeholder="不限"></label><label class="field"><span>最多</span><input type="number" min="0" data-ref="maxPosts" placeholder="不限"></label></div></div>
              </div>
            </div>
            <div style="margin-top:9px"><label class="relationship-filter"><input type="checkbox" data-ref="mutual"><span class="relationship-mark">↔</span><span>仅互关</span><small>对方也关注你</small></label></div>
            <div class="filter-apply-row"><button class="filter-reset" data-action="clearFilters">清除条件</button><div class="filter-commit"><span class="match-count" data-ref="matchCount">已匹配 0 人</span><button class="filter-apply" data-action="applyFilters">确定筛选</button></div></div>
            <div class="selection-panel">
              <div class="selection-panel-head"><div><span class="panel-kicker">选择结果</span><strong data-ref="selectionCount">已选 0 人</strong></div><span class="selection-scope" data-ref="selectionScope">当前结果 0 人</span></div>
              <div class="selection-actions"><button data-ref="selectFiltered" data-action="selectFiltered">全选当前结果</button><button data-action="invertSelection">反选当前结果</button><button data-ref="clearSelection" data-action="clearSelection">清空已选</button><button class="selection-export" data-action="exportCsv">导出已选 CSV</button></div>
            </div>
            <div class="list-viewport" data-ref="listViewport"><div class="empty">打开自己的 Following 页面并滚动，扩展会在本地收集可见用户。</div></div>
            <div class="selection-hint">继续滚动 Following 页面可以捕获更多账号；数据只保存在本地。</div>
          </section>
          <section class="section">
            <div class="section-title"><span>导入到列表</span><span><button data-action="importSnapshot">导入快照</button></span></div>
            <label class="field"><span>列表分享链接</span><input type="text" data-ref="listUrl" placeholder="https://x.com/i/lists/1234567890"></label>
            <details><summary>节奏与恢复设置</summary><div class="advanced">
              <div class="grid2"><label class="field"><span>两次操作间隔（秒）</span><div class="grid2"><input type="number" min="1" max="60" step="0.1" data-ref="betweenMin"><input type="number" min="1" max="120" step="0.1" data-ref="betweenMax"></div></label><label class="field"><span>每批账号数</span><input type="number" min="1" max="500" data-ref="batchSize"></label></div>
              <div class="grid3"><label class="field"><span>批次暂停最短（分钟）</span><input type="number" min="0.1" max="60" step="0.1" data-ref="pauseMin"></label><label class="field"><span>批次暂停最长（分钟）</span><input type="number" min="0.1" max="120" step="0.1" data-ref="pauseMax"></label><label class="field"><span>单项最多重试</span><input type="number" min="1" max="5" data-ref="maxAttempts"></label></div>
            </div></details>
            <label class="check" style="margin-top:10px"><input type="checkbox" data-ref="ackRisk"> 我已确认这是对当前 X 会话的批量列表操作 <span class="risk-inline">（可能触发 X 限流或账号限制）</span></label>
            <div class="selection-hint" data-ref="confirmSummary">目标列表：未设置 · 待导入：0 人</div>
            <button class="primary" data-ref="start" data-action="start">导入到列表</button>
            <div class="job-card" data-ref="jobCard" hidden>
              <div class="job-head"><span data-ref="jobStatus">无任务</span><span data-ref="jobProgressText">0 / 0</span></div>
              <div class="progress-track"><div class="progress-fill" data-ref="progressFill"></div></div>
              <div class="job-meta"><span data-ref="jobMeta">等待开始</span><span data-ref="cooldownText"></span></div>
              <div class="job-action-groups">
                <div class="job-action-group flow">
                  <div class="job-action-group-label">流程控制</div>
                  <div class="job-action-grid"><button data-ref="resume" data-action="resume">继续</button><button class="danger" data-ref="pause" data-action="pause">暂停</button><button data-action="stopJob">停止并保留进度</button><button data-action="archiveJob">结束任务</button></div>
                </div>
                <div class="job-action-group export">
                  <div class="job-action-group-label">导出数据</div>
                  <div class="job-action-grid"><button data-action="exportJob">导出结果</button><button data-action="exportSnapshot">导出快照</button></div>
                </div>
              </div>
            </div>
          </section>
          <section class="section" data-ref="historySection" hidden>
            <div class="section-title"><span>历史任务</span><span><button data-action="importSnapshot">导入快照</button> <span class="muted" data-ref="historyCount">0 个</span></span></div>
            <div class="history-list" data-ref="historyList"></div>
            <input type="file" data-ref="snapshotInput" accept="application/json,.json" hidden>
          </section>
        </div>
        <div class="toast" data-ref="toast" hidden></div>
      </section>`;
    document.documentElement.appendChild(host);
    refs.host = host;
    refs.panel = shadow.querySelector(".xcurator-panel");
    shadow.querySelectorAll("[data-ref]").forEach((node) => { refs[node.dataset.ref] = node; });
    shadow.addEventListener("click", onClick);
    shadow.addEventListener("input", onInput);
    shadow.addEventListener("change", onChange);
    refs.listViewport.addEventListener("scroll", renderList);
  }

  function onInput(event) {
    const name = event.target?.dataset?.ref;
    if (!name) return;
    if (Object.prototype.hasOwnProperty.call(state.filters, name)) {
      state.filterDraft[name] = event.target.type === "checkbox" ? Boolean(event.target.checked) : event.target.value;
      persistSoon();
      renderFilterSummary();
    }
    if (name === "listUrl") { state.listUrl = event.target.value; persistSoon(); renderJob(); renderConfirmation(); }
  }

  function onChange(event) {
    const name = event.target?.dataset?.ref;
    if (!name) return;
    if (name === "snapshotInput") {
      importSnapshotFile(event.target.files?.[0]);
      event.target.value = "";
      return;
    }
    if (Object.prototype.hasOwnProperty.call(state.filters, name) && event.target.type === "checkbox") {
      state.filterDraft[name] = Boolean(event.target.checked);
      persistSoon();
      renderFilterSummary();
    }
  }

  function onClick(event) {
    const action = event.target?.dataset?.action;
    if (action) {
      event.preventDefault();
      const historyId = event.target?.dataset?.historyId || event.target?.closest?.("[data-history-id]")?.dataset?.historyId;
      const handlers = { close: closePanel, applyFilters, clearFilters, clearCaptured: clearCapturedUsers, selectFiltered, invertSelection, clearSelection, exportCsv, exportJob, exportSnapshot, importSnapshot, start: startOrResume, resume: resumeJob, pause: pauseJob, stopJob, archiveJob };
      if (action === "retryHistory") return retryHistory(historyId);
      if (action === "deleteHistory") return deleteHistory(historyId);
      if (action === "exportHistory") return exportHistory(historyId);
      (handlers[action] || (() => {}))();
      return;
    }
    const checkbox = event.target?.closest?.("input[data-user-id]");
    if (checkbox) {
      const id = checkbox.dataset.userId;
      const set = selectedSet();
      checkbox.checked ? set.add(id) : set.delete(id);
      state.selectedIds = Array.from(set);
      persistSoon();
      renderSelection();
    }
  }

  function openPanel() {
    runtime.panelOpen = true;
    refs.panel.hidden = false;
    render();
  }

  function closePanel() {
    runtime.panelOpen = false;
    refs.panel.hidden = true;
  }

  function filteredUsers(filters = state.filters) {
    const f = filters;
    const query = String(f.query || "").trim().toLowerCase();
    const includes = splitTerms(f.include);
    const excludes = splitTerms(f.exclude);
    const minFollowers = f.minFollowers === "" ? null : Number(f.minFollowers);
    const maxFollowers = f.maxFollowers === "" ? null : Number(f.maxFollowers);
    const location = String(f.location || "").trim().toLowerCase();
    const minFollowing = f.minFollowing === "" ? null : Number(f.minFollowing);
    const maxFollowing = f.maxFollowing === "" ? null : Number(f.maxFollowing);
    const minPosts = f.minPosts === "" ? null : Number(f.minPosts);
    const maxPosts = f.maxPosts === "" ? null : Number(f.maxPosts);
    return state.users.filter((user) => {
      const haystack = `${user.name} @${user.handle} ${user.bio} ${user.location}`.toLowerCase();
      if (query && !haystack.includes(query.replace(/^@/, ""))) return false;
      if (includes.length && !includes.every((term) => haystack.includes(term))) return false;
      if (excludes.some((term) => haystack.includes(term))) return false;
      if (minFollowers != null && user.followers < minFollowers) return false;
      if (maxFollowers != null && user.followers > maxFollowers) return false;
      if (location && !String(user.location || "").toLowerCase().includes(location)) return false;
      if (minFollowing != null && user.following < minFollowing) return false;
      if (maxFollowing != null && user.following > maxFollowing) return false;
      if (minPosts != null && user.posts < minPosts) return false;
      if (maxPosts != null && user.posts > maxPosts) return false;
      if (f.mutual && !user.mutual) return false;
      return true;
    });
  }

  function normalizeFilters(input) {
    const normalized = { ...DEFAULT_FILTERS };
    for (const [key, fallback] of Object.entries(DEFAULT_FILTERS)) {
      const value = input?.[key];
      normalized[key] = typeof fallback === "boolean" ? value === true : (value == null || value === false ? "" : String(value));
    }
    return normalized;
  }

  function sameFilters(left, right) {
    return Object.keys(DEFAULT_FILTERS).every((key) => left?.[key] === right?.[key]);
  }

  function renderFilterSummary() {
    if (!refs.matchCount) return;
    const count = filteredUsers(state.filterDraft).length;
    const pending = !sameFilters(state.filterDraft, state.filters);
    refs.matchCount.textContent = `${pending ? "预览" : "已匹配"} ${formatNumber(count)} 人`;
    refs.matchCount.classList.toggle("pending", pending);
  }

  function applyFilters() {
    state.filters = normalizeFilters(state.filterDraft);
    refs.listViewport.scrollTop = 0;
    persistNow();
    render();
    showToast("已应用筛选条件");
  }

  function clearFilters() {
    state.filterDraft = { ...DEFAULT_FILTERS };
    state.filters = { ...DEFAULT_FILTERS };
    refs.listViewport.scrollTop = 0;
    persistNow();
    render();
    showToast("已清除全部筛选条件");
  }

  function renderList() {
    if (!refs.listViewport) return;
    runtime.filteredUsers = filteredUsers();
    const users = runtime.filteredUsers;
    if (!users.length) {
      refs.listViewport.innerHTML = `<div class="empty">${state.users.length ? "没有符合当前筛选条件的用户。" : "打开自己的 Following 页面并滚动，扩展会在本地收集可见用户。"}</div>`;
      return;
    }
    const scrollTop = refs.listViewport.scrollTop;
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 2);
    const end = Math.min(users.length, start + VISIBLE_ROWS + 5);
    const checked = selectedSet();
    const rows = users.slice(start, end).map((user) => {
      const avatar = user.avatar ? `<img class="avatar" loading="lazy" referrerpolicy="no-referrer" src="${escapeHtml(user.avatar)}" alt="">` : `<div class="avatar"></div>`;
      return `<label class="list-row"><input class="row-check" type="checkbox" data-user-id="${escapeHtml(user.id)}" ${checked.has(user.id) ? "checked" : ""}><span>${avatar}</span><span class="user-main"><span class="user-name"><strong>${escapeHtml(user.name || user.handle)}</strong>${user.verified ? '<span class="badge">●</span>' : ''}</span><span class="handle">@${escapeHtml(user.handle)}</span><span class="bio">${escapeHtml(user.bio || "暂无简介")}</span><span class="metrics">粉丝 ${formatNumber(user.followers)} · 关注 ${formatNumber(user.following)} · 发帖 ${formatNumber(user.posts)}${user.location ? ` · ${escapeHtml(user.location)}` : ""}${user.mutual ? " · 互关" : ""}</span></span></label>`;
    }).join("");
    const top = start * ROW_HEIGHT;
    const bottom = Math.max(0, (users.length - end) * ROW_HEIGHT);
    refs.listViewport.innerHTML = `<div style="height:${top}px"></div>${rows}<div style="height:${bottom}px"></div>`;
  }

  function renderFilters() {
    Object.entries(state.filterDraft).forEach(([key, value]) => {
      if (refs[key]) refs[key].type === "checkbox" ? (refs[key].checked = Boolean(value)) : (refs[key].value = value ?? "");
    });
    refs.listUrl.value = state.listUrl || "";
    Object.entries({ ...DEFAULT_SETTINGS, ...(state.settings || {}) }).forEach(([key, value]) => { if (refs[key]) refs[key].value = value; });
    renderFilterSummary();
  }

  function renderSelection() {
    const visibleSelected = runtime.filteredUsers.filter((user) => state.selectedIds.includes(user.id)).length;
    refs.selectionCount.textContent = `已选 ${formatNumber(state.selectedIds.length)} 人`;
    refs.selectionScope.textContent = `当前结果 ${formatNumber(runtime.filteredUsers.length)} 人`;
    refs.captureCount.textContent = `已捕获 ${formatNumber(state.users.length)} 人`;
    refs.clearCaptured.disabled = state.users.length === 0;
    refs.selectFiltered.disabled = false;
    refs.clearSelection.disabled = state.selectedIds.length === 0;
    refs.selectionCount.title = `当前筛选结果中已选 ${visibleSelected} 人`;
  }

  function renderPageStatus() {
    const ready = runtime.sessionReady;
    refs.sessionDot.classList.toggle("ready", ready);
    if (runtime.storageCorrupt) refs.pageStatus.textContent = "本地状态结构异常，当前仅可查看，已阻止写操作";
    else if (!isFollowingPage()) refs.pageStatus.textContent = "请打开自己的 Following 页面，再滚动加载用户";
    else if (ready && runtime.sessionFingerprint) refs.pageStatus.textContent = `已连接当前 X 会话 · ${state.users.length ? "继续滚动可捕获更多" : "等待用户数据"}`;
    else if (ready) refs.pageStatus.textContent = "已监听页面会话，但还未得到可用于校验的会话指纹";
    else if (runtime.hookReady) refs.pageStatus.textContent = "已监听页面请求，等待 X 返回关注用户数据…";
    else refs.pageStatus.textContent = "正在连接 X 页面…";
  }

  function renderJob() {
    const job = state.job;
    refs.jobCard.hidden = !job;
    if (!job) {
      refs.start.textContent = "导入到列表";
      return;
    }
    recomputeJobStats(job);
    const p = globalThis.XListJob.progress(job);
    refs.jobStatus.textContent = jobStatusLabel(job.status);
    refs.jobProgressText.textContent = `${p.done} / ${p.total}`;
    refs.progressFill.style.width = `${p.percent}%`;
    const current = globalThis.XListJob.firstRunnable(job);
    refs.jobMeta.textContent = `${p.pending} 人待处理 · ${job.successCount || 0} 成功 · ${job.alreadyCount || 0} 已存在 · ${job.failureCount || 0} 失败${current ? ` · 下一位 @${escapeHtml(state.users.find((u) => u.id === current.userId)?.handle || current.userId)}` : ""}`;
    const batchCooldown = job.status === "cooldown" && job.cooldownReason === "batch";
    const batchWaiting = batchCooldown && job.cooldownUntil > Date.now();
    const platformWaiting = job.status === "cooldown" && job.cooldownReason === "platform" && job.cooldownUntil > Date.now();
    if (batchWaiting) refs.cooldownText.textContent = `约 ${formatDuration(job.cooldownUntil - Date.now())} 后自动继续`;
    else if (batchCooldown) refs.cooldownText.textContent = "等待 X 会话连接后自动继续";
    else if (platformWaiting) refs.cooldownText.textContent = `约 ${formatDuration(job.cooldownUntil - Date.now())} 后可继续`;
    else refs.cooldownText.textContent = job.status === "completed" ? "队列已完成" : "";
    refs.start.textContent = job.status === "completed" ? "新建导入任务" : (job.status === "running" ? "导入进行中" : (batchWaiting ? "取消等待，继续任务" : (platformWaiting ? "等待 X 冷却" : "继续上次导入")));
    refs.start.disabled = runtime.running || platformWaiting;
    refs.resume.textContent = batchWaiting ? "取消等待" : "继续";
    refs.resume.disabled = runtime.running || job.status === "completed" || platformWaiting;
    refs.pause.disabled = !runtime.running && !["running", "cooldown"].includes(job.status);
  }

  function renderConfirmation() {
    const parsed = parseListUrl(refs.listUrl.value || state.listUrl);
    const pending = state.job ? globalThis.XListJob.progress(state.job).pending : state.selectedIds.length;
    refs.confirmSummary.textContent = `目标列表：${parsed ? `${parsed.id}（链接有效）` : "未设置或链接无效"} · 已选择：${state.selectedIds.length} 人 · 待导入：${pending} 人`;
  }

  function renderHistory() {
    const history = Array.isArray(state.history) ? state.history : [];
    refs.historySection.hidden = history.length === 0;
    refs.historyCount.textContent = `${history.length} 个`;
    refs.historyList.innerHTML = history.map((job) => {
      recomputeJobStats(job);
      const p = globalThis.XListJob.progress(job);
      const failed = job.queue.filter((item) => item.status === "failed").length;
      const listLabel = escapeHtml(job.listUrl || `list/${job.listId}`);
      return `<article class="history-item" data-history-id="${escapeHtml(job.id)}"><strong>${jobStatusLabel(job.status)} · ${p.done}/${p.total}</strong><div class="history-meta">${listLabel} · 成功 ${job.successCount || 0} · 已存在 ${job.queue.filter((item) => item.status === "already_member").length} · 失败 ${failed}</div><div class="history-actions"><button data-action="retryHistory" data-history-id="${escapeHtml(job.id)}" ${failed ? "" : "disabled"}>重试失败项</button><button data-action="exportHistory" data-history-id="${escapeHtml(job.id)}">导出</button><button class="danger" data-action="deleteHistory" data-history-id="${escapeHtml(job.id)}">删除</button></div></article>`;
    }).join("");
  }

  function render() {
    renderFilters();
    renderPageStatus();
    renderList();
    renderSelection();
    renderJob();
    renderConfirmation();
    renderHistory();
  }

  function mergeUsers(incoming) {
    const map = new Map(state.users.map((user) => [user.id, user]));
    for (const raw of incoming || []) {
      const user = normalizeUser(raw);
      if (!user) continue;
      map.set(user.id, { ...(map.get(user.id) || {}), ...user });
    }
    state.users = Array.from(map.values()).slice(0, MAX_USERS);
    state.selectedIds = state.selectedIds.filter((id) => map.has(id));
    persistSoon();
    if (runtime.panelOpen) render();
  }

  function clearCapturedUsers() {
    if (!state.users.length) return showToast("当前没有已捕获的账号");
    if (!window.confirm("清除当前已捕获的账号数据和勾选状态？不会删除正在导入的任务、进度或历史记录。")) return;
    state.users = [];
    state.selectedIds = [];
    runtime.filteredUsers = [];
    runtime.captureGeneration += 1;
    runtime.captureClearPending = true;
    persistNow();
    render();
    window.postMessage({ source: SOURCE, kind: "CLEAR_CAPTURED_USERS" }, "*");
    showToast("已清除已捕获账号。刷新并继续滚动 Following 页面即可重新捕获。");
  }

  function selectFiltered() {
    const set = selectedSet();
    runtime.filteredUsers.forEach((user) => set.add(user.id));
    state.selectedIds = Array.from(set);
    persistSoon();
    render();
  }

  function clearSelection() {
    state.selectedIds = [];
    persistSoon();
    render();
  }

  function invertSelection() {
    const set = selectedSet();
    runtime.filteredUsers.forEach((user) => set.has(user.id) ? set.delete(user.id) : set.add(user.id));
    state.selectedIds = Array.from(set);
    persistSoon();
    render();
  }

  function exportCsv() {
    const chosen = state.users.filter((user) => state.selectedIds.includes(user.id));
    if (!chosen.length) return showToast("请先选择至少一个用户");
    const headers = ["USERID", "handle", "name", "bio", "location", "followers", "following", "posts"];
    const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [headers.join(","), ...chosen.map((user) => [user.id, user.handle, user.name, user.bio, user.location, user.followers, user.following, user.posts].map(csvCell).join(","))].join("\n");
    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `x-following-selection-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportJob() {
    if (!state.job) return showToast("当前没有导入任务");
    const users = new Map(state.users.map((user) => [user.id, user]));
    const headers = ["USERID", "handle", "name", "status", "attempts", "http_status", "error_code", "error_path", "response_shape", "duration_ms", "last_error"];
    const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [headers.join(","), ...state.job.queue.map((item) => {
      const user = users.get(item.userId) || {};
      return [item.userId, user.handle || "", user.name || "", item.status, item.attempts || 0, item.httpStatus || 0, item.errorCode || "", item.errorPath || "", item.responseShape || "", item.durationMs || 0, item.lastError || ""].map(csvCell).join(",");
    })].join("\n");
    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `x-list-import-result-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function downloadJson(filename, value) {
    const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportSnapshot() {
    if (!state.job) return showToast("当前没有导入任务");
    downloadJson(`x-list-job-${state.job.id}.json`, { schemaVersion: state.schemaVersion, exportedAt: Date.now(), job: state.job });
  }

  function importSnapshot() {
    refs.snapshotInput.click();
  }

  function importSnapshotFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ""));
        const imported = parsed?.job || parsed;
        if (!imported?.id || !imported?.listId || !Array.isArray(imported.queue) || !imported.queue.length) throw new Error("任务快照结构不完整");
        if (state.job && !["completed", "stopped"].includes(state.job.status)) throw new Error("请先暂停或归档当前任务");
        imported.status = "stopped";
        imported.cooldownUntil = 0;
        imported.updatedAt = Date.now();
        imported.queue.forEach((item) => { if (item.status === "in_flight") item.status = "retryable"; });
        state.job = imported;
        state.listUrl = imported.listUrl || state.listUrl;
        persistNow();
        render();
        showToast("任务快照已导入，校验通过后可继续");
      } catch (error) {
        showToast(`任务快照导入失败：${error?.message || "格式错误"}`);
      }
    };
    reader.readAsText(file);
  }

  function exportHistory(historyId) {
    const job = state.history.find((entry) => entry.id === historyId);
    if (job) downloadJson(`x-list-job-${job.id}.json`, { schemaVersion: state.schemaVersion, exportedAt: Date.now(), job });
  }

  function retryHistory(historyId) {
    if (state.job && state.job.status !== "completed" && state.job.status !== "stopped") return showToast("请先暂停或归档当前任务");
    const archived = state.history.find((entry) => entry.id === historyId);
    if (!archived) return;
    const copy = JSON.parse(JSON.stringify(archived));
    copy.id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    copy.status = "paused";
    copy.cooldownUntil = 0;
    copy.createdAt = Date.now();
    copy.updatedAt = Date.now();
    copy.queue.forEach((item) => {
      if (["failed", "retryable", "in_flight"].includes(item.status)) {
        item.status = "pending";
        item.attempts = 0;
        item.lastError = "";
        item.httpStatus = 0;
        item.errorCode = "";
        item.errorPath = "";
        item.responseShape = "";
        item.durationMs = 0;
        item.lastAttemptAt = 0;
        item.completedAt = 0;
      }
    });
    state.job = copy;
    persistNow();
    render();
    showToast("失败项已复制到新任务，点击“继续”开始");
  }

  function deleteHistory(historyId) {
    if (!window.confirm("删除这条历史任务记录？不会影响 X 列表里的已添加成员。")) return;
    state.history = state.history.filter((entry) => entry.id !== historyId);
    persistNow();
    render();
  }

  function loadState(saved) {
    if (!saved || typeof saved !== "object") return;
    const invalidJob = saved.job && (!Array.isArray(saved.job.queue) || !saved.job.listId);
    if ((saved.schemaVersion && Number(saved.schemaVersion) > 1) || (saved.users != null && !Array.isArray(saved.users)) || (saved.history != null && !Array.isArray(saved.history)) || invalidJob) {
      runtime.storageCorrupt = true;
      return;
    }
    state.schemaVersion = Number(saved.schemaVersion || 1);
    state.users = Array.isArray(saved.users) ? saved.users.map(normalizeUser).filter(Boolean).slice(0, MAX_USERS) : [];
    state.selectedIds = Array.isArray(saved.selectedIds) ? saved.selectedIds.map(String) : [];
    state.filters = normalizeFilters(saved.filters);
    state.filterDraft = normalizeFilters(saved.filterDraft || state.filters);
    state.listUrl = String(saved.listUrl || "");
    state.settings = { ...DEFAULT_SETTINGS, ...(saved.settings || {}) };
    state.job = saved.job ? globalThis.XListJob.normalizeAfterRestart(saved.job) : null;
    state.history = Array.isArray(saved.history) ? saved.history.slice(0, 20) : [];
    state.sessionFingerprint = String(saved.sessionFingerprint || "");
  }

  function addMemberViaPage(listId, userId) {
    const requestId = `add_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        runtime.pendingAdds.delete(requestId);
        resolve({ ok: false, retryable: true, resultKind: "failed", status: 0, message: "页面请求超时" });
      }, 45000);
      runtime.pendingAdds.set(requestId, (result) => { clearTimeout(timeout); resolve(result); });
      window.postMessage({ source: SOURCE, kind: "ADD_MEMBER", requestId, listId, userId }, "*");
    });
  }

  function cooldownFor(status) {
    if (status === 429 || status === 403) return 10 * 60 * 1000;
    if (status === 400) return 2 * 60 * 1000;
    return 60 * 1000;
  }

  function pauseForBatch(job) {
    const settings = job.settings || DEFAULT_SETTINGS;
    return Math.round(randomBetween(settings.pauseMin, settings.pauseMax) * 60 * 1000);
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function clearCooldownTimers() {
    if (runtime.cooldownTimer) clearTimeout(runtime.cooldownTimer);
    if (runtime.cooldownTicker) clearInterval(runtime.cooldownTicker);
    runtime.cooldownTimer = 0;
    runtime.cooldownTicker = 0;
  }

  function isBatchWaiting(job) {
    return Boolean(job && job.status === "cooldown" && job.cooldownReason === "batch" && Number(job.cooldownUntil || 0) > Date.now());
  }

  function isAutoBatchCooldown(job) {
    return Boolean(job && job.status === "cooldown" && job.cooldownReason === "batch");
  }

  function refreshCooldownDisplay() {
    if (!isAutoBatchCooldown(state.job)) {
      if (runtime.cooldownTicker) clearCooldownTimers();
      return;
    }
    renderJob();
  }

  function scheduleAutoResume(job) {
    clearCooldownTimers();
    if (!isAutoBatchCooldown(job)) return;
    const jobId = job.id;
    const waitMs = Math.max(0, Number(job.cooldownUntil) - Date.now());
    runtime.cooldownTicker = setInterval(refreshCooldownDisplay, 1000);
    runtime.cooldownTimer = setTimeout(() => autoResumeBatch(jobId), waitMs + 25);
  }

  async function autoResumeBatch(jobId) {
    const job = state.job;
    if (!job || job.id !== jobId || !isAutoBatchCooldown(job)) return;
    if (Number(job.cooldownUntil || 0) > Date.now()) return scheduleAutoResume(job);
    if (!runtime.sessionFingerprint) {
      runtime.cooldownTimer = setTimeout(() => autoResumeBatch(jobId), 5000);
      return;
    }
    clearCooldownTimers();
    job.cooldownUntil = 0;
    job.cooldownReason = "";
    await persistNow();
    render();
    runJob();
  }

  async function cancelBatchWaitAndResume() {
    const job = state.job;
    if (!isBatchWaiting(job)) return runJob();
    clearCooldownTimers();
    job.cooldownUntil = 0;
    job.cooldownReason = "";
    await persistNow();
    showToast("已取消批次等待，正在继续任务");
    runJob();
  }

  async function runJob() {
    if (runtime.running || !state.job) return;
    const job = state.job;
    if (!(await validateJobForResume(job))) return;
    if (job.status === "completed") return;
    if (job.cooldownUntil && Date.now() < job.cooldownUntil) {
      job.status = "cooldown";
      renderJob();
      if (job.cooldownReason === "batch") {
        scheduleAutoResume(job);
        showToast(`批次等待中，约 ${formatDuration(job.cooldownUntil - Date.now())} 后自动继续`);
      } else {
        showToast(`仍在冷却中，约 ${formatDuration(job.cooldownUntil - Date.now())} 后再继续`);
      }
      return;
    }
    clearCooldownTimers();
    runtime.running = true;
    runtime.stopRequested = false;
    job.status = "running";
    job.cooldownUntil = 0;
    job.cooldownReason = "";
    await persistNow();
    renderJob();
    try {
      while (!runtime.stopRequested && globalThis.XListJob.firstRunnable(job)) {
        const item = globalThis.XListJob.firstRunnable(job);
        job.currentItemId = item.userId;
        item.status = "in_flight";
        item.attempts = (item.attempts || 0) + 1;
        item.lastAttemptAt = Date.now();
        await persistNow();
        renderJob();
        const result = await addMemberViaPage(job.listId, item.userId);
        item.httpStatus = Number(result.status || 0);
        item.errorCode = String(result.errorCode || "");
        item.errorPath = String(result.errorPath || "");
        item.responseShape = String(result.responseShape || "");
        item.durationMs = Number(result.durationMs || 0);
        if (result.ok) {
          item.status = result.resultKind === "already_member" ? "already_member" : "succeeded";
          item.completedAt = Date.now();
          item.lastError = "";
          job.successCount = (job.successCount || 0) + 1;
        } else if (result.retryable && item.attempts < Number(job.settings.maxAttempts || DEFAULT_SETTINGS.maxAttempts)) {
          item.status = "retryable";
          item.lastError = result.message || `HTTP ${result.status || "?"}`;
          job.status = "cooldown";
          job.cooldownUntil = Date.now() + cooldownFor(result.status);
          job.cooldownReason = "platform";
          await persistNow();
          showToast(`X 暂停或拒绝了本次操作，${formatDuration(job.cooldownUntil - Date.now())} 后可继续`);
          break;
        } else {
          item.status = "failed";
          item.lastError = result.message || `HTTP ${result.status || "?"}`;
          job.failureCount = (job.failureCount || 0) + 1;
        }
        if (globalThis.XListJob.isComplete(job)) {
          job.status = "completed";
          job.completedAt = Date.now();
          break;
        }
        const completed = job.queue.filter((entry) => ["succeeded", "already_member"].includes(entry.status)).length;
        if (completed > 0 && completed % Number(job.settings.batchSize || DEFAULT_SETTINGS.batchSize) === 0) {
          job.status = "cooldown";
          job.cooldownUntil = Date.now() + pauseForBatch(job);
          job.cooldownReason = "batch";
          await persistNow();
          scheduleAutoResume(job);
          showToast(`已处理 ${completed} 人，进入批次暂停`);
          break;
        }
        await persistNow();
        renderJob();
        await delay(randomBetween(Number(job.settings.betweenMin), Number(job.settings.betweenMax)) * 1000);
      }
      if (!globalThis.XListJob.firstRunnable(job) && job.queue.length) {
        job.status = "completed";
        job.completedAt = Date.now();
      } else if (runtime.stopRequested && job.status === "running") {
        job.status = "paused";
      }
    } finally {
      job.currentItemId = "";
      runtime.running = false;
      await persistNow();
      render();
    }
  }

  async function validateJobForResume(job) {
    const parsed = parseListUrl(refs.listUrl.value || job.listUrl);
    if (!parsed || parsed.id !== String(job.listId) || parsed.id !== String(parseListUrl(job.listUrl)?.id || "")) {
      showToast("目标列表链接与任务不一致，请恢复原链接或先归档任务");
      return false;
    }
    if (!runtime.sessionFingerprint) {
      showToast("尚未取得当前 X 会话指纹，请等待页面请求完成后再继续");
      return false;
    }
    if (job.ownerFingerprint && job.ownerFingerprint !== runtime.sessionFingerprint) {
      showToast("当前 X 账号与创建任务时不同，已阻止续传");
      return false;
    }
    const ids = job.queue.map((item) => String(item.userId));
    if (job.queueHash && job.queueHash !== await queueFingerprint(job.listId, ids)) {
      showToast("任务队列校验失败，已阻止继续以避免错位添加");
      return false;
    }
    return true;
  }

  async function startOrResume() {
    if (runtime.running) return;
    if (runtime.storageCorrupt) return showToast("本地状态结构异常，已进入只读保护，请导出/清理后再开始");
    if (state.job && state.job.status !== "completed") return cancelBatchWaitAndResume();
    const parsed = parseListUrl(refs.listUrl.value);
    if (!parsed) return showToast("请输入有效的 X 列表分享链接");
    if (!state.selectedIds.length) return showToast("请先勾选要导入的用户");
    if (state.selectedIds.length > 5000) return showToast("单个 X 列表最多容纳 5,000 个账号");
    if (!refs.ackRisk.checked) return showToast("请先确认当前 X 会话的批量操作风险");
    if (!runtime.sessionFingerprint) return showToast("尚未取得当前 X 会话指纹，请等待页面请求完成后再开始");
    state.listUrl = refs.listUrl.value.trim();
    state.settings = currentSettings();
    const queueHash = await queueFingerprint(parsed.id, state.selectedIds);
    state.job = globalThis.XListJob.createJob({ listUrl: state.listUrl, listId: parsed.id, selectedIds: state.selectedIds, settings: state.settings, queueHash, ownerFingerprint: runtime.sessionFingerprint });
    runJob();
  }

  function resumeJob() {
    if (!state.job) return startOrResume();
    if (state.job.status === "completed") return;
    cancelBatchWaitAndResume();
  }

  function pauseJob() {
    if (!state.job) return;
    clearCooldownTimers();
    runtime.stopRequested = true;
    state.job.status = "paused";
    state.job.cooldownUntil = 0;
    state.job.cooldownReason = "";
    persistNow();
    renderJob();
  }

  function stopJob() {
    if (!state.job) return;
    clearCooldownTimers();
    runtime.stopRequested = true;
    state.job.status = "stopped";
    state.job.cooldownUntil = 0;
    state.job.cooldownReason = "";
    persistNow();
    renderJob();
    showToast("任务已停止，未处理项仍保留，可稍后继续或归档");
  }

  function archiveJob() {
    if (!state.job) return showToast("当前没有活动任务");
    if (runtime.running) return showToast("请先暂停任务，再结束任务");
    if (!window.confirm("结束当前任务？结束后不会自动继续，并会保存在历史任务中。")) return;
    const archived = JSON.parse(JSON.stringify({ ...state.job, status: state.job.status === "completed" ? "completed" : "stopped" }));
    clearCooldownTimers();
    state.history = [archived, ...(state.history || [])].slice(0, 20);
    state.job = null;
    persistNow();
    render();
  }

  function onMessage(event) {
    if (event.source !== window || event.data?.source !== SOURCE) return;
    const data = event.data;
    if (data.kind === "X_HOOK_READY") runtime.hookReady = true;
    if (data.kind === "X_SESSION_READY") {
      runtime.sessionReady = Boolean(data.ready || data.fingerprint);
      runtime.sessionFingerprint = String(data.fingerprint || runtime.sessionFingerprint || "");
      if (runtime.sessionFingerprint) state.sessionFingerprint = runtime.sessionFingerprint;
      persistSoon();
      if (isBatchWaiting(state.job)) scheduleAutoResume(state.job);
    }
    if (data.kind === "X_CAPTURE_CLEARED") {
      runtime.captureGeneration = Number(data.captureGeneration || runtime.captureGeneration);
      runtime.captureClearPending = false;
    }
    if (data.kind === "X_USERS" || data.kind === "X_SNAPSHOT") {
      const generation = Number(data.captureGeneration || 0);
      if (!runtime.captureClearPending && generation >= runtime.captureGeneration) {
        runtime.captureGeneration = generation;
        mergeUsers(data.users);
      }
    }
    if (data.kind === "X_ADD_RESULT") {
      const resolve = runtime.pendingAdds.get(data.requestId);
      if (resolve) { runtime.pendingAdds.delete(data.requestId); resolve(data); }
    }
    if (runtime.panelOpen) renderPageStatus();
  }

  async function init() {
    window.addEventListener("message", onMessage);
    chrome.runtime.onMessage.addListener((message) => { if (message?.type === "TOGGLE_PANEL") runtime.panelOpen ? closePanel() : openPanel(); });
    createUi();
    try {
      loadState(await globalThis.XListStore.load());
    } catch (error) {
      showToast(`读取本地状态失败：${error?.message || "storage error"}`);
    }
    render();
    if (isBatchWaiting(state.job)) scheduleAutoResume(state.job);
    window.postMessage({ source: SOURCE, kind: "REQUEST_SNAPSHOT" }, "*");
  }

  init();
})();
