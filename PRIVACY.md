# Privacy Policy — X Follow to List

Effective date: July 19, 2026  
Extension version covered: 0.1.9

## English

### 1. Scope

X Follow to List is a browser extension that helps a user filter accounts loaded on their own X Following page and add accounts they explicitly select to an X List they specify. This policy describes the data handled by the extension.

### 2. Data the extension accesses and processes

The extension may process the following data only while providing its user-facing features:

- Public X profile information returned on the user's Following page, including account ID, handle, display name, biography, location, profile image URL, follower/following/post counts, verification or protection status, and mutual-follow status.
- User choices and local task data, including filters, selected account IDs, the target X List URL and ID, rate settings, queue status, retry results, task history, and exported snapshots or CSV files initiated by the user.
- X session information required to perform a user-confirmed List action. The extension temporarily accesses the authorization and CSRF/session values already present in the active X page. Raw authorization and CSRF values remain in page memory, are not written to extension storage or exports, and are not sent to the developer. A one-way session fingerprint may be stored locally to prevent a task from resuming under a different X session.

### 3. How the data is used

The data is used only to:

- display, filter, and select accounts the user follows;
- export data when the user clicks an export control;
- add explicitly selected accounts to the X List supplied by the user;
- pause, resume, validate, and report the progress of local tasks; and
- prevent a saved task from resuming with a mismatched X session or List.

The extension does not use this data for advertising, profiling, credit decisions, or any purpose unrelated to the extension's single purpose.

### 4. Storage and retention

Account data, preferences, selections, session fingerprints, and task state are stored locally in the browser using IndexedDB or `chrome.storage.local`. The developer does not operate a server for this extension.

Local data remains until the user clears captured data or task history, clears browser/extension storage, or uninstalls the extension. Files exported by the user remain wherever the user saves them and are controlled by the user.

### 5. Sharing and transmission

The developer does not receive, sell, rent, or share user data. The extension communicates with `x.com` or `twitter.com` only as necessary to read the active Following experience and submit List actions requested and confirmed by the user. No analytics, advertising SDK, telemetry service, or third-party data broker is included.

### 6. Permissions

- `storage`: saves captured accounts, filters, selections, settings, and recoverable task state locally.
- Access to `https://x.com/*` and `https://twitter.com/*`: runs the extension only on X/Twitter pages so it can read the user's Following results and submit user-confirmed List actions through the active X session.

### 7. User controls

Users can clear captured account data in the extension, clear or archive task records, export selected data or task snapshots, delete exported files, clear extension storage in the browser, or uninstall the extension.

### 8. Security

The extension does not ask users to provide their X password, browser cookies, authorization headers, or session tokens. Users should never send these credentials to the developer or include them in public issue reports.

### 9. Changes and contact

Material changes to this policy will be published in this repository with an updated effective date. Questions or privacy requests may be submitted through [GitHub Issues](https://github.com/DrErwin/X-Follow-to-List/issues). Do not include private account or session information in an issue.

### 10. Independent product notice

X Follow to List is an independent, unofficial tool. It is not affiliated with, authorized by, or endorsed by X Corp. X and related marks belong to their respective owners.

---

## 中文

### 1. 适用范围

X Follow to List 是一个浏览器扩展，用于筛选用户自己的 X Following 页面中已加载的账号，并将用户明确选择的账号加入其指定的 X List。本政策说明扩展会处理哪些数据以及如何使用这些数据。

### 2. 扩展访问和处理的数据

扩展仅会为实现用户可见功能而处理以下数据：

- X Following 页面返回的公开账号资料，包括账号 ID、用户名、显示名称、简介、位置、头像地址、粉丝数、关注数、发帖数、认证或保护状态以及互关状态。
- 用户选择和本地任务数据，包括筛选条件、所选账号 ID、目标 X List 链接及 ID、节奏设置、队列状态、重试结果、任务历史，以及由用户主动导出的快照或 CSV 文件。
- 执行用户确认的 List 操作所必需的 X 会话信息。扩展会临时访问当前 X 页面中已有的授权信息和 CSRF/会话值。原始授权值与 CSRF 值只存在于页面内存中，不会写入扩展存储或导出文件，也不会发送给开发者。扩展可能在本地保存不可逆的会话指纹，用于防止任务在不同 X 会话下错误续传。

### 3. 数据用途

上述数据仅用于：

- 显示、筛选和选择用户正在关注的账号；
- 在用户主动点击导出时生成文件；
- 将用户明确选择的账号加入用户提供的 X List；
- 暂停、恢复、校验并显示本地任务进度；
- 防止已保存任务在错误的 X 会话或 List 下恢复。

扩展不会将这些数据用于广告、画像、信用决策或与扩展单一用途无关的目的。

### 4. 存储和保留

账号数据、偏好设置、选择状态、会话指纹和任务状态通过 IndexedDB 或 `chrome.storage.local` 保存在浏览器本地。开发者不为本扩展运营服务器。

本地数据会保留到用户清除捕获数据或任务历史、清除浏览器/扩展存储，或者卸载扩展为止。用户主动导出的文件由用户自行选择保存位置并自行管理。

### 5. 数据共享与传输

开发者不会接收、出售、出租或共享用户数据。扩展仅在读取当前 Following 内容以及执行用户明确请求并确认的 List 操作时与 `x.com` 或 `twitter.com` 通信。扩展不包含分析、广告、遥测或第三方数据代理服务。

### 6. 权限用途

- `storage`：在本地保存已捕获账号、筛选条件、选择状态、设置和可恢复任务。
- `https://x.com/*` 与 `https://twitter.com/*`：仅在 X/Twitter 页面运行，以读取用户的 Following 结果，并通过当前 X 会话执行用户确认的 List 操作。

### 7. 用户控制

用户可以在扩展中清除已捕获账号、清除或归档任务记录、导出所选数据或任务快照、删除导出文件、在浏览器中清除扩展存储，或者卸载扩展。

### 8. 安全

扩展不会要求用户提供 X 密码、浏览器 Cookie、授权请求头或会话令牌。用户不应向开发者发送这些凭据，也不应将其写入公开的问题反馈。

### 9. 政策更新与联系方式

本政策如有重大变更，将在本仓库发布并更新生效日期。如有隐私相关问题，可通过 [GitHub Issues](https://github.com/DrErwin/X-Follow-to-List/issues) 联系。请勿在问题中包含私人账号或会话信息。

### 10. 独立产品声明

X Follow to List 是独立开发的非官方工具，与 X Corp. 不存在隶属、授权或背书关系。X 及相关标识归各自权利人所有。
