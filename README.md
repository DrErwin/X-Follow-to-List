<p align="center">
  <img src="extension-dist/icons/icon128.png" alt="X Follow to List" width="96">
</p>

<h1 align="center">X Follow to List</h1>

<p align="center">
  <strong>Filter your Following and bulk add selected accounts to any X/Twitter List</strong><br>
  Free local extension for Chrome, Edge, and other Chromium browsers. No API key, no server.
</p>

## Usage Demo / 使用演示

### 1. Get your following list / 获取关注列表

<p align="center">
  <img src="assets/demo/capture-following.gif" alt="Get your following list" width="680">
</p>

### 2. Filter accounts / 筛选账号

<p align="center">
  <img src="assets/demo/filter-accounts.gif" alt="Filter accounts" width="360">
</p>

### 3. Add accounts to your list / 添加到列表

<p align="center">
  <img src="assets/demo/add-to-list.gif" alt="Add accounts to your list" width="680">
</p>

## Install / 安装

> [!IMPORTANT]
> This extension is distributed through GitHub and must be installed in Developer mode. The ZIP cannot be installed directly.

### Download the ready-to-use package / 下载成品包

1. [Download `X-follow-to-list-0.1.9.zip`](https://github.com/DrErwin/X-Follow-to-List/raw/main/X-follow-to-list-0.1.9.zip). The SHA-256 checksum is listed in [`SHA256SUMS.txt`](SHA256SUMS.txt).
2. Extract the ZIP to a permanent folder. Do not delete that folder after installation.
3. Open your browser's extension page:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Brave: `brave://extensions/`
4. Enable **Developer mode / 开发人员模式**.
5. Click **Load unpacked / 加载已解压的扩展程序**.
6. Select the extracted folder containing `manifest.json`.

To install from source, clone this repository and select the [`extension-dist`](extension-dist) folder instead.

## Features / 功能

- Capture accounts loaded while scrolling your X Following page / 滚动 Following 页面时捕获已加载账号
- Filter by keywords, profile counts, location, mutual follows, and more / 按关键词、账号数据、位置、互关等条件筛选
- Select accounts individually, select all, invert selection, or export CSV / 单选、全选、反选或导出 CSV
- Add selected accounts to a specified X List with configurable intervals / 按可配置间隔将所选账号加入指定 List
- Pause, resume, retry, view history, and export or import task snapshots / 暂停、继续、重试、历史记录及任务快照
- Store account data, settings, and task state locally in the browser / 数据、设置及任务状态仅保存在浏览器本地

## How to Use / 使用方法

1. Sign in to X and open your Following page, such as `https://x.com/yourname/following`.
2. Scroll down to load the accounts you want to manage.
3. Click the extension icon, set filters, and choose accounts.
4. Open the target X List and copy its share link into the extension.
5. Confirm the target and start the task. Begin with a small batch and conservative intervals.

## Privacy and Safety / 隐私与安全

- No developer-operated server, analytics, advertising, or telemetry.
- No X API key is required; actions use your current X web session.
- Raw authorization and CSRF values are not stored or exported.
- Bulk activity may trigger X rate limits or temporary restrictions. Use small batches and follow X's current rules.
- Export a task snapshot before clearing browser data or uninstalling the extension.
- Never include passwords, cookies, authorization headers, or session tokens in a public Issue.

See the full [Privacy Policy / 隐私政策](PRIVACY.md).

## Updating / 更新

1. Download and extract the new package.
2. Export a task snapshot, then replace the files inside the folder you originally loaded.
3. Click **Reload / 重新加载** on the extension card.

Loading the update from a different folder may create a different unpacked extension ID and separate local storage, so updating the original folder is recommended.

## Feedback / 反馈

Found a problem? [Open an Issue](https://github.com/DrErwin/X-Follow-to-List/issues/new/choose) and include your browser version, extension version, page URL type, and reproduction steps. Do not include private session information.

X Follow to List is an independent, unofficial tool and is not affiliated with, authorized by, or endorsed by X Corp.

If it helps, a GitHub Star is appreciated.
