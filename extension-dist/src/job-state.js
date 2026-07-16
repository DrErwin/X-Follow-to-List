(function attachJobState(global) {
  // `failed` is terminal for the current run. Historical-task retry creates a
  // new job and explicitly moves failed items back to `pending`.
  const TERMINAL = new Set(["succeeded", "already_member", "failed", "skipped"]);

  function createJob({ listUrl, listId, selectedIds, settings, queueHash = "", ownerFingerprint = "" }) {
    const now = Date.now();
    return {
      id: `job_${now}_${Math.random().toString(36).slice(2, 8)}`,
      listUrl,
      listId,
      queueHash,
      ownerFingerprint,
      status: "draft",
      queue: selectedIds.map((userId) => ({
        userId,
        status: "pending",
        attempts: 0,
        lastError: "",
        httpStatus: 0,
        errorCode: "",
        errorPath: "",
        responseShape: "",
        durationMs: 0,
        lastAttemptAt: 0,
        completedAt: 0
      })),
      settings: { ...settings },
      currentItemId: "",
      cooldownUntil: 0,
      cooldownReason: "",
      createdAt: now,
      updatedAt: now,
      completedAt: 0,
      successCount: 0,
      failureCount: 0
    };
  }

  function normalizeAfterRestart(job) {
    if (!job?.queue) return job;
    job.queue.forEach((item) => {
      if (item.status === "in_flight") {
        item.status = "retryable";
        item.lastError = "浏览器关闭或页面刷新后自动回收";
      }
    });
    if (job.status === "running" || job.status === "in_flight") {
      job.status = "paused";
    }
    job.cooldownReason = String(job.cooldownReason || "");
    job.currentItemId = "";
    job.updatedAt = Date.now();
    return job;
  }

  function firstRunnable(job) {
    return job?.queue?.find((item) => !TERMINAL.has(item.status));
  }

  function progress(job) {
    const total = job?.queue?.length || 0;
    const done = job?.queue?.filter((item) => TERMINAL.has(item.status)).length || 0;
    return {
      total,
      done,
      pending: Math.max(0, total - done),
      percent: total ? Math.round((done / total) * 100) : 0
    };
  }

  function isComplete(job) {
    return Boolean(job?.queue?.length) && job.queue.every((item) => TERMINAL.has(item.status));
  }

  global.XListJob = {
    TERMINAL,
    createJob,
    normalizeAfterRestart,
    firstRunnable,
    progress,
    isComplete
  };
})(globalThis);
