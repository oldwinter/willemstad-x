# AGENTS.md

给在本仓库工作的 agent 的入口。完整说明在
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)（结构 / 构建 / 编码）与
[CONTRIBUTING.md](CONTRIBUTING.md)（改动流程）；本文件只记它们没写、但每次接手都要知道的事。

## 跑验证

CI 的网关是 `npm run verify`（= build:audit → build:check → check:version → lint:css → test）。

**本机沙箱里 `npm test` 跑不完**，原因是环境而不是代码：`node --test` 用管道 spawn 每个测试文件，
沙箱禁止管道 → 11 个文件全部 `Error: spawn EPERM`。可用的替代：

```powershell
node scripts/build.mjs --audit          # 分片树一致
node scripts/build.mjs --check          # src/ 与 theme.css 字节一致
node scripts/check-version.mjs          # 三处版本号一致
npx stylelint "src/**/*.css"            # lint 基线
node tests/assets.test.mjs              # 逐文件跑：不经 runner，测试体在进程内执行
```

逐文件跑只对**不自己 spawn 的**测试有效。`build` / `structure` / `stylelint` / `version` 四个文件内部
用 `spawnSync` 调脚本，同样 EPERM——它们对应的检查直接用上面三条命令代替。要完整跑，去 CI 或非沙箱终端。

`justfile` 的 recipe 全部经 bash，本机 msys2 起不来
（`bash.exe: couldn't create signal pipe, Win32 error 5`，根因见全局 `~/.agents/AGENTS.md` §3.5），
所以 `just` / `just ci` / `just check` 只属于 GitHub Actions。

## 改之前

- `src/` 是唯一源码；`theme.css` / `publish.css` 是提交进仓库的构建产物（Obsidian 直接安装）。改 `src/` 后重建，并让 `--check` 保持绿。
- `theme.css` 是 5 MB 单行文件：不要 `Get-Content -Raw`，不要用脚本整份正则解析（会 OOM）。取样用 `read` 分页，或仓库已有的脚本。
- 本仓库是浅克隆（`.git/shallow` 存在，无 tag）：回答"历史上有没有"用 `git ls-remote`，或声明结论只对当前树成立。
- 探索时不要递归整个仓库：`archive/` 是历史截图归档（已 gitignore），`node_modules/` 与 5 MB 产物都会拖垮 shell。

## 验证面

- `tests/` = node:test 套件，每个文件守什么见 [tests/README.md](tests/README.md)；`test/` = python unittest，锁版本与发布元数据。
- 视觉验证：`.cursor/skills/verify-willemstad/SKILL.md`（Chromium + CDP + 截图）。入口是 bash 包装（本机跑不了）；可移植的部件是 `helpers/serve.py`、`helpers/cdp.mjs`、`helpers/chrome-args.mjs`。
- 缺陷与历史决策：[docs/KNOWN-ISSUES.md](docs/KNOWN-ISSUES.md)。

## 写文档

散文里不要重复机器能算的事实（基线哈希、测试文件数 / 用例数）：单一来源是
`tests/build.test.mjs` 的基线常量和测试运行器本身。抄进散文就会漂——这个仓库已经漂过一次。
`tests/docs-claims.test.mjs` 会拦住重复，改文档时先看它。
