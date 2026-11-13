# 贡献指南 / Contributing

感谢你帮助改进 dsh-liquid-glass。

> Before opening a pull request, read this guide. By contributing, you agree to follow its workflow, naming, testing, and release rules.
>
> 提交 Pull Request 前请读完本指南。提交贡献即表示你愿意遵守这里的流程、命名、测试和发布要求。

## 分支与提交 / Branches and commits

- Branch from the latest `main`, one logical change per branch and PR. Branch names use `<type>/<short-description>`, e.g. `docs/sync-readme`, `fix/gif-persist`, `chore/add-npm-test-script`. `type` is one of `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`.
- 从最新 `main` 切分支，一个分支和 PR 只处理一项逻辑改动。分支名用 `<type>/<short-description>`，如 `docs/sync-readme`、`fix/gif-persist`。
- Commit messages and PR titles use Conventional Commits: `<type>(<optional-scope>): <description>`, imperative mood, within 72 characters, e.g. `docs(readme): sync 0.2.0 release status`.
- 提交信息和 PR 标题用 Conventional Commits 格式：`<type>(<optional-scope>): <description>`，现在时命令语气，72 字符内。

## 测试 / Tests

- Run `npm test` (`node test/smoke.test.mjs`) before opening a PR and make sure it passes.
- 开 PR 前跑 `npm test`（即 `node test/smoke.test.mjs`），确认通过。
- If your change affects observable behaviour, add or update tests for it.
- 改动影响可观察行为时，请补充或更新测试。

## 宿主接口优先 / Host interfaces first

- Build on the DeepSeek Harness official client interfaces wherever they exist (theme, locale, slots, shortcuts, storage). Do not guess DOM selectors, patch host files, or invent host APIs.
- 有官方宿主接口的地方一律用官方接口（主题、语言、插槽、快捷键、存储等）。不要猜 DOM 选择器、不要改宿主文件、不要自造宿主接口。
- Where no official interface exists, say so in the PR and leave the behaviour out rather than working around it.
- 没有官方接口时，在 PR 里写明，并宁可不做该行为，也不要绕过去实现。

## 文档同步 / Docs stay in sync

- `README.md` and `README.zh.md` describe the same features; update both together.
- `README.md` 与 `README.zh.md` 描述同一功能，改一处就要同步另一处。

## 发布规则 / Releases

- Only the maintainer releases. A release is made by pushing a tag `v*` (e.g. `v0.2.0`) — that alone triggers the publish workflow (CI → version check → pack dry-run → npm publish → GitHub release).
- 只有维护者发版。发版方式是推送 `v*` 形式的 tag（如 `v0.2.0`），仅此动作触发发布流程（CI → 版本核对 → 打包演练 → npm 发包 → 建 GitHub Release）。
- Never run `npm publish` by hand, and never create a GitHub release manually before pushing the tag — the workflow creates the release last, and a manually created release makes its final step fail.
- 不要手动 `npm publish`，不要在推 tag 之前手动建 GitHub Release——发布流程最后一步才会建 Release，提前手动建会导致流程失败。
- Do not change the version number or the CHANGELOG history entries in a feature/fix PR; version and CHANGELOG updates belong to the release branch.
- 功能/修复 PR 里不要改版本号和 CHANGELOG 历史条目；版本与 CHANGELOG 更新属于发布分支。
