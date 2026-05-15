# 极致写作 — UI 美化与应用图标设计

> 已确认方向：专业控制台界面，文稿 + AI 光标应用图标。

## 背景

当前应用已经具备写作、知识库、历史和设置等核心页面，但视觉层仍偏 MVP：页面之间样式不完全统一，侧栏缺少品牌识别，表单、卡片、状态和工作台层级较平。此次改造目标是在不改变业务流程的前提下，让应用更像一个成熟的 AI 写作桌面工具。

## 目标

- 建立统一的专业控制台视觉：深色品牌侧栏、浅蓝灰背景、白色功能面板、蓝绿强调色。
- 提升写作首页和写作工作台的视觉层级，让“输入目标 → 生成规划 → 分段写作 → 导出”流程更清晰。
- 统一知识库、历史、设置页的页面头、卡片、按钮、状态标签和空状态。
- 设计并落地应用图标：深色圆角底、白色文稿、蓝绿 AI 光标/光点。
- 保持现有 React + Tailwind v4 + lucide-react 技术栈，不引入新的 UI 框架。

## 非目标

- 不重做写作流程、状态管理、IPC、数据库或 Agent 编排。
- 不引入账户、云同步、主题切换或复杂偏好设置。
- 不把这次改造扩展成完整组件库重构。
- 不承诺生产安装包的 `.icns` / `.ico` 全套打包配置；本次先提供可复用 SVG 图标，并在 renderer 品牌区和 HTML favicon 中使用。

## 视觉方向

采用“专业控制台”方向：

- 主色：深海军蓝侧栏和标题文字，建立工具感与稳定感。
- 强调色：蓝色用于主操作、进度、选中态；绿色用于完成态和 AI 光标渐变。
- 背景：页面使用浅蓝灰，面板保持白色，减少纯白满屏带来的平淡感。
- 边框与阴影：使用轻边框、柔和阴影和 8-12px 圆角，保持办公软件的克制感。
- 排版：中文优先，标题清晰，辅助信息用较低对比度，不使用大面积营销式 hero。

## 应用图标设计

图标采用“文稿 + AI 光标”：

- 画布：圆角方形深色底，适合桌面应用和侧栏品牌位。
- 主体：白色文稿形状，内部有蓝色标题线和灰色正文线，表达写作内容。
- AI 光标：右下角蓝绿渐变的笔形/光标形状，覆盖在文稿上，表达 AI 辅助生成与修订。
- 小尺寸策略：保留大块轮廓和高对比度，不依赖细碎文字或复杂线条。

落地资产：

- 新增 `apps/desktop/src/renderer/assets/app-icon.svg`。
- 侧栏顶部使用该 SVG 作为品牌图标。
- `apps/desktop/src/renderer/index.html` 增加 SVG favicon 引用。

## 页面设计

### App 外壳与侧栏

- `App.tsx` 的根背景改为浅蓝灰，主内容区保持可滚动。
- `Sidebar` 增加品牌图标区和更清晰的导航态：
  - 深色背景。
  - 当前页面使用蓝色高亮。
  - 图标和文字保留现有紧凑宽度，避免占用桌面空间。
- 侧栏底部可保留轻量版本/状态文本，但不新增交互。

### 写作首页

`WritingForm` 改成更强的工作台入口：

- 顶部使用简洁标题区，突出“新建写作”和当前类型。
- 输入面板增加轻微阴影和更大的内边距，让写作目标成为第一视觉焦点。
- starter prompts 改为更清晰的建议 chips。
- 参数区保持 5 项控制，但通过卡片化背景和统一 focus ring 增强可扫读性。
- 主按钮使用蓝色或深色主操作样式，和全局主按钮保持一致。

### 写作工作台

`WritingPage` 保持现有三栏结构，但优化视觉层级：

- 顶部 header 增加渐变/半透明面板感，状态 pill 更醒目。
- 左栏计划卡片更像任务流，当前章节使用蓝色高亮，完成章节使用绿色。
- 中栏正文区域强化“生成内容/最终成稿”的阅读体验，减轻边框噪音。
- 右栏运行状态、修订、导出按钮统一成操作面板。
- 长耗时提示和错误提示保留现有逻辑，视觉上改成一致的告警面板。

### 知识库与详情页

- `KnowledgePage` 增加统一页面头、创建按钮和空状态。
- 创建知识库表单使用白色面板，不再像临时灰色块。
- `KnowledgeCard` 改成更明确的文档统计卡片，文件夹图标使用蓝色强调背景。
- `KnowledgeDetailPage` 统一返回按钮、上传按钮、处理中提示和文档列表状态标签。

### 历史页

- `HistoryPage` 增加统一页面头和说明文本。
- 历史项目卡片增加元信息分组、状态 pill 和更清晰 hover 态。
- 空状态用图标 + 文案，和知识库空状态一致。

### 设置页

现有设置页已经接近目标风格，主要做统一：

- header 和侧栏选项沿用新色彩 token。
- 预设卡片、输入框、测试结果 pill 与其他页面保持一致。
- 不改变保存、测试、选择模型逻辑。

## 实现边界

主要触达文件：

- `apps/desktop/src/renderer/globals.css`
- `apps/desktop/src/renderer/App.tsx`
- `apps/desktop/src/renderer/index.html`
- `apps/desktop/src/renderer/components/ui/sidebar.tsx`
- `apps/desktop/src/renderer/pages/Writing.tsx`
- `apps/desktop/src/renderer/components/writing/WritingForm.tsx`
- `apps/desktop/src/renderer/components/writing/WritingOutput.tsx`
- `apps/desktop/src/renderer/components/writing/WritingPlanPanel.tsx`
- `apps/desktop/src/renderer/components/writing/WritingPlanEditor.tsx`
- `apps/desktop/src/renderer/pages/Knowledge.tsx`
- `apps/desktop/src/renderer/pages/KnowledgeDetail.tsx`
- `apps/desktop/src/renderer/components/knowledge/KnowledgeCard.tsx`
- `apps/desktop/src/renderer/pages/History.tsx`
- `apps/desktop/src/renderer/pages/Settings.tsx`
- `apps/desktop/src/renderer/assets/app-icon.svg`

Edits should remain presentational unless a small structural wrapper is needed for layout. Existing store APIs, route paths and IPC calls must stay unchanged.

## Error, Empty, Loading States

- Loading/planning/writing states keep existing status sources and spinner icons.
- Errors remain visible in rose/red panels with clear retry action.
- Empty states should use one icon, one concise message and one obvious next action when available.
- Disabled controls keep `disabled:cursor-not-allowed` and opacity treatment.

## Responsive Behavior

The desktop app is primarily wide-screen, but renderer layouts should not break when narrower:

- Writing workbench can keep the current three-column grid for desktop.
- Use `minmax(0, 1fr)` and `min-w-0` where text truncation matters.
- Form controls should wrap on smaller widths instead of overflowing.
- Long generated content remains scrollable in the main content area.

## Testing And Verification

Implementation should be verified with:

- `pnpm --filter @app/desktop typecheck`
- Focused component/unit tests if existing test coverage is affected.
- `pnpm build` or `pnpm --filter @app/desktop build` if typecheck passes and dependencies are available.
- Visual check of the renderer with the in-app browser or Electron dev window, including:
  - writing homepage
  - workbench states where reachable
  - knowledge empty/list states
  - history empty/list states
  - settings page

## Acceptance Criteria

- The app has a coherent professional-control-panel appearance across primary pages.
- The sidebar displays the new brand icon and all navigation states remain usable.
- The new SVG icon is present, referenced by the renderer, and visually matches the approved “文稿 + AI 光标” direction.
- Existing writing, knowledge, history and settings interactions remain wired to the same handlers.
- TypeScript typecheck passes, or any failure is documented with exact cause if unrelated to the UI work.
