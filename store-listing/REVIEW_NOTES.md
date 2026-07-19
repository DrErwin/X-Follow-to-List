# Certification / Review Notes

Paste the relevant section into the private reviewer-notes field. Do not publish test-account credentials in this repository.

## English

### Purpose

The extension has one purpose: it lets a user filter accounts loaded from their own X Following page and add accounts they explicitly select to an X List they specify.

### Preconditions

1. Use a test X account that has at least one followed account and owns or can manage an X List.
2. Sign in to `https://x.com` in the browser.
3. If reviewer credentials are required, provide a dedicated test account only through the store's secure reviewer-credentials field. No credentials are included in the package.

### Test steps

1. Install the extension and open `https://x.com/<test-username>/following`.
2. Click the extension toolbar icon. A panel opens on the X page.
3. Scroll the Following page. The `Captured` count increases as X loads followed accounts.
4. Enter a filter or leave the filters empty, click the filter confirmation button, and select one or more test accounts.
5. Open a test X List owned by the test account and copy its URL, such as `https://x.com/i/lists/<list-id>`.
6. Paste the List URL into the panel. For review, select only one test account and retain conservative timing settings.
7. Check the risk acknowledgement and start the import task.
8. Confirm that progress is displayed and that the selected account appears in the test List. Remove it manually after testing if desired.
9. Optional: pause/resume the task, export a CSV, or export/import a task snapshot to verify local recovery features.

### Expected behavior and scope

- Clicking the toolbar icon outside `x.com` or `twitter.com` intentionally does nothing because the extension is scoped to those sites.
- The extension reads only X Following responses that match Following-related GraphQL request names; unrelated recommendations are ignored.
- List changes occur only after explicit account selection, a target List URL, risk acknowledgement, and a user-initiated start action.
- Raw X authorization and CSRF/session values are used transiently in the active page to send the confirmed X request. They are not stored, exported, or sent to the developer.
- Account data, filters, selections, and task progress are stored locally in IndexedDB or `chrome.storage.local`.
- There is no developer server, remote executable code, analytics, advertising, or telemetry.

### External-service dependency

The extension depends on the current X web interface and the review account's access to X. X may rate-limit, reject, or change List operations. The extension does not bypass a platform cooldown.

## 中文

### 测试前提

1. 使用至少关注了一个账号、并拥有或可管理一个 X List 的测试账号。
2. 在浏览器中登录 `https://x.com`。
3. 如果审核方要求账号凭据，只通过商店后台的安全审核凭据字段提供专用测试账号，不要把凭据写入仓库或普通备注。

### 测试步骤

1. 安装扩展并打开 `https://x.com/<测试用户名>/following`。
2. 点击扩展工具栏图标，在 X 页面中打开面板。
3. 向下滚动 Following 页面，观察“已捕获”数量增加。
4. 设置筛选条件或保留空条件，确认筛选并选择一个测试账号。
5. 打开测试账号拥有的 X List，复制类似 `https://x.com/i/lists/<list-id>` 的链接。
6. 粘贴 List 链接，审核时只选择一个账号并保留较保守的节奏设置。
7. 勾选风险确认并启动任务。
8. 检查任务进度，并确认所选账号已出现在测试 List 中。
