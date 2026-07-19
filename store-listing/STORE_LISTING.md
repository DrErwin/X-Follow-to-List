# Store Listing Content

Use this file when completing Chrome Web Store and Microsoft Edge Add-ons listing forms.

## Shared fields

- Product name: `X Follow to List`
- Category: `Productivity`
- Website: `https://github.com/DrErwin/X-Follow-to-List`
- Support URL: `https://github.com/DrErwin/X-Follow-to-List/issues`
- Privacy policy URL: `https://github.com/DrErwin/X-Follow-to-List/blob/main/PRIVACY.md`
- Default language: `English (United States)`
- Additional language: `Chinese (Simplified)`
- Affiliation disclosure: `X Follow to List is an independent, unofficial tool and is not affiliated with or endorsed by X Corp.`

## English listing

### Short description

Filter accounts you follow on X and add selected accounts to an X List with local, recoverable tasks.

### Full description

X Follow to List helps you organize the accounts you already follow on X. Open your Following page and scroll normally; the extension collects the public account information returned for the accounts loaded on that page. You can then filter by name, username, biography, location, keywords, follower count, following count, post count, or mutual-follow status.

Choose accounts individually or select the current filtered results, then export your selection as CSV or add the selected accounts to an X List you specify. Import tasks include configurable random intervals, batch pauses, retries, progress reporting, pause and resume controls, history, and snapshot export/import.

All account data, filters, selections, and task state are stored locally in your browser. The extension has no developer-operated server, analytics, advertising, or telemetry. It uses your active X session only to perform List actions that you explicitly select and confirm.

Bulk activity may be limited or restricted by X. Start with a small batch, use conservative intervals, and follow X's current rules. X Follow to List is an independent, unofficial tool and is not affiliated with or endorsed by X Corp.

### Search terms

`X list`, `following organizer`, `account filter`, `list manager`, `Twitter list`, `productivity`, `local extension`

## 中文商店文案

### 简短说明

筛选你在 X 上关注的账号，并通过仅保存在本地的可恢复任务，将所选账号加入指定 X List。

### 完整说明

X Follow to List 帮助你整理已经关注的 X 账号。打开自己的 Following 页面并正常向下滚动，扩展会收集该页面已加载账号的公开资料。随后可以按照姓名、用户名、简介、位置、包含或排除关键词、粉丝数、关注数、发帖数以及是否互关进行组合筛选。

你可以逐个选择账号，也可以全选或反选当前筛选结果，然后把所选账号导出为 CSV，或者加入你指定的 X List。导入任务支持随机操作间隔、分批暂停、失败重试、实时进度、暂停与继续、历史记录以及任务快照导入和导出。

账号资料、筛选条件、选择状态和任务进度均保存在当前浏览器本地。扩展没有开发者运营的服务器，不包含分析、广告或遥测服务。只有在你明确选择账号、提供目标 List 并确认风险后，扩展才会通过当前 X 会话执行对应的 List 操作。

批量操作可能受到 X 的限制。建议先用少量账号测试，采用保守的操作间隔，并遵守 X 当前的平台规则。X Follow to List 是独立开发的非官方工具，与 X Corp. 不存在隶属、授权或背书关系。

### 搜索词

`X 列表`, `关注整理`, `账号筛选`, `列表管理`, `Twitter List`, `效率工具`, `本地扩展`

## Chrome privacy declarations

### Single purpose

Filter accounts loaded from the user's own X Following page and add accounts explicitly selected by the user to an X List specified by the user.

### Permission justification: storage

Required to save captured public account information, filters, selections, rate settings, task queues, progress, and history locally so the user can pause and recover a task after a page refresh or browser restart.

### Permission justification: host access

Access to `x.com` and `twitter.com` is required because the extension operates only on X/Twitter pages. It reads Following responses for the user-visible filtering feature and submits List membership requests only after the user selects accounts, supplies a List URL, acknowledges the risk, and starts the task.

### Remote code

`No.` All executable JavaScript is included in the submitted extension package. The extension does not download or evaluate remote code.

### Data-handling summary

The extension handles public X profile information, locally stored user choices and task state, website content from the X Following experience, and transient X authentication/session information required to submit user-confirmed requests. Raw authorization and CSRF values are not persisted or exported and are not transmitted to the developer. No data is sold, shared with third parties, used for advertising, or used for purposes unrelated to the extension's single purpose.

When the dashboard asks for data-type declarations, answer consistently with the detailed disclosures in `PRIVACY.md`. Local-only processing must still be disclosed.

## Microsoft Edge privacy answers

- Does the extension access, collect, or transmit personal information? `Yes — it accesses and stores public X profile information locally to provide filtering and task recovery.`
- Privacy policy URL: `https://github.com/DrErwin/X-Follow-to-List/blob/main/PRIVACY.md`
- Remote code: `No.`
- Data sold or shared: `No.`
- Developer-operated server: `No.`
