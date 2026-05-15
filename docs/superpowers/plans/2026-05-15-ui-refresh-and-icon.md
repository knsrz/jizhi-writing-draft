# UI Refresh And Icon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the Electron renderer into a coherent professional writing console and add the approved "document + AI cursor" application icon.

**Architecture:** Keep all changes in the renderer layer. Use presentational React/Tailwind edits, add one SVG asset, and keep existing routes, Zustand stores, IPC calls, and writing logic unchanged.

**Tech Stack:** Electron renderer, React 19, TypeScript, Tailwind CSS v4, lucide-react, Vitest/typecheck.

---

## File Structure

- Create `apps/desktop/src/renderer/assets/app-icon.svg`: reusable SVG for sidebar brand and favicon.
- Modify `apps/desktop/src/renderer/index.html`: add SVG favicon link.
- Modify `apps/desktop/src/renderer/globals.css`: add base page color, text rendering, selection, scrollbar, and shared focus defaults.
- Modify `apps/desktop/src/renderer/App.tsx`: update shell background and main panel styling.
- Modify `apps/desktop/src/renderer/components/ui/sidebar.tsx`: add brand icon and professional navigation styling.
- Modify writing UI files:
  - `apps/desktop/src/renderer/pages/Writing.tsx`
  - `apps/desktop/src/renderer/components/writing/WritingForm.tsx`
  - `apps/desktop/src/renderer/components/writing/WritingOutput.tsx`
  - `apps/desktop/src/renderer/components/writing/WritingPlanPanel.tsx`
  - `apps/desktop/src/renderer/components/writing/WritingPlanEditor.tsx`
- Modify knowledge UI files:
  - `apps/desktop/src/renderer/pages/Knowledge.tsx`
  - `apps/desktop/src/renderer/pages/KnowledgeDetail.tsx`
  - `apps/desktop/src/renderer/components/knowledge/KnowledgeCard.tsx`
- Modify `apps/desktop/src/renderer/pages/History.tsx`: align history cards and empty state.
- Modify `apps/desktop/src/renderer/pages/Settings.tsx`: align existing settings page with the new visual language.

## Visual Constants

Use these Tailwind values consistently:

- App background: `bg-[#eef4fb]`
- Sidebar background: `bg-[#07111f]`
- Primary text: `text-slate-950`
- Secondary text: `text-slate-500`
- Primary action: `bg-blue-600 hover:bg-blue-700`
- Success state: `bg-emerald-50 text-emerald-700`
- Active panel ring: `ring-2 ring-blue-100`
- Card shell: `rounded-xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/60`
- Strong card shell: `rounded-2xl border border-slate-200/80 bg-white shadow-lg shadow-slate-200/60`
- Input focus: `focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100`

---

### Task 1: Add Visual Foundations And Icon Asset

**Files:**
- Create: `apps/desktop/src/renderer/assets/app-icon.svg`
- Modify: `apps/desktop/src/renderer/index.html`
- Modify: `apps/desktop/src/renderer/globals.css`
- Modify: `apps/desktop/src/renderer/App.tsx`

- [ ] **Step 1: Create the SVG icon asset**

Create `apps/desktop/src/renderer/assets/app-icon.svg` with this exact SVG:

```svg
<svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">
  <title id="title">极致写作</title>
  <desc id="desc">A document with an AI cursor on a dark blue rounded square.</desc>
  <rect width="256" height="256" rx="58" fill="url(#background)" />
  <circle cx="204" cy="208" r="64" fill="#20C997" fill-opacity="0.18" />
  <circle cx="68" cy="54" r="42" fill="#2F7CFF" fill-opacity="0.16" />
  <path d="M83 54H157L184 82V190C184 199.941 175.941 208 166 208H83C73.059 208 65 199.941 65 190V72C65 62.059 73.059 54 83 54Z" fill="#F8FAFC" />
  <path d="M156 55V79C156 85.075 160.925 90 167 90H184" fill="#DBEAFE" />
  <path d="M88 100H142" stroke="#2563EB" stroke-width="10" stroke-linecap="round" />
  <path d="M88 126H158" stroke="#94A3B8" stroke-width="10" stroke-linecap="round" />
  <path d="M88 152H134" stroke="#CBD5E1" stroke-width="10" stroke-linecap="round" />
  <path d="M162.082 142.062L209.691 185.711C214.391 190.018 212.203 197.84 205.938 199.047L187.172 202.664L179.219 220.062C176.578 225.844 168.512 226.246 165.309 220.758L132.68 164.844C129.535 159.449 134.457 153.094 140.562 154.672L162.082 142.062Z" fill="url(#cursor)" />
  <path d="M166.75 177.25L189.5 197.5" stroke="white" stroke-width="8" stroke-linecap="round" />
  <defs>
    <linearGradient id="background" x1="42" y1="22" x2="222" y2="236" gradientUnits="userSpaceOnUse">
      <stop stop-color="#07111F" />
      <stop offset="1" stop-color="#10233B" />
    </linearGradient>
    <linearGradient id="cursor" x1="134" y1="145" x2="211" y2="221" gradientUnits="userSpaceOnUse">
      <stop stop-color="#2F7CFF" />
      <stop offset="1" stop-color="#20C997" />
    </linearGradient>
  </defs>
</svg>
```

- [ ] **Step 2: Reference the SVG favicon**

In `apps/desktop/src/renderer/index.html`, add this line inside `<head>` after the viewport meta tag:

```html
    <link rel="icon" type="image/svg+xml" href="./assets/app-icon.svg" />
```

- [ ] **Step 3: Add global visual defaults**

Replace `apps/desktop/src/renderer/globals.css` with:

```css
@import "tailwindcss";

:root {
  color: #0f172a;
  background: #eef4fb;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  min-width: 960px;
  background:
    radial-gradient(circle at top left, rgba(47, 124, 255, 0.1), transparent 28rem),
    #eef4fb;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei',
    sans-serif;
}

* {
  box-sizing: border-box;
}

::selection {
  background: rgba(37, 99, 235, 0.18);
}

::-webkit-scrollbar {
  height: 10px;
  width: 10px;
}

::-webkit-scrollbar-thumb {
  border: 2px solid transparent;
  border-radius: 999px;
  background: rgba(100, 116, 139, 0.36);
  background-clip: content-box;
}

::-webkit-scrollbar-track {
  background: transparent;
}
```

- [ ] **Step 4: Update app shell**

In `apps/desktop/src/renderer/App.tsx`, change the root wrapper from:

```tsx
<div className="flex h-screen bg-white">
```

to:

```tsx
<div className="flex h-screen overflow-hidden bg-[#eef4fb] text-slate-950">
```

and change the `main` class from:

```tsx
<main className="flex-1 overflow-auto">
```

to:

```tsx
<main className="min-w-0 flex-1 overflow-auto">
```

- [ ] **Step 5: Verify foundation typecheck**

Run:

```bash
pnpm --filter @app/desktop typecheck
```

Expected: command exits 0. If it fails, fix only errors introduced by this task.

- [ ] **Step 6: Commit foundation**

```bash
git add apps/desktop/src/renderer/assets/app-icon.svg apps/desktop/src/renderer/index.html apps/desktop/src/renderer/globals.css apps/desktop/src/renderer/App.tsx
git commit -m "feat: add renderer visual foundation"
```

---

### Task 2: Refresh Sidebar Branding And Navigation

**Files:**
- Modify: `apps/desktop/src/renderer/components/ui/sidebar.tsx`

- [ ] **Step 1: Import the app icon**

Add this import after the lucide import:

```tsx
import appIcon from '../../assets/app-icon.svg';
```

- [ ] **Step 2: Replace the sidebar layout**

Keep `navItems`, `location`, and `handleWritingClick` unchanged. Replace the returned `<aside>` with:

```tsx
<aside className="flex h-screen w-20 shrink-0 flex-col items-center border-r border-white/10 bg-[#07111f] px-3 py-4 text-white shadow-2xl shadow-slate-950/20">
  <div className="mb-6 flex flex-col items-center gap-2">
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
      <img src={appIcon} alt="极致写作" className="h-9 w-9 rounded-xl" />
    </div>
    <span className="text-[10px] font-semibold tracking-[0.16em] text-slate-400">JIZHI</span>
  </div>

  <nav className="flex flex-1 flex-col items-center gap-2">
    {navItems.map(({ to, label, icon: Icon }) => (
      <NavLink
        key={to}
        to={to}
        onClick={to === '/' ? handleWritingClick : undefined}
        className={({ isActive }) =>
          `group flex h-14 w-14 flex-col items-center justify-center rounded-2xl text-[11px] transition-all ${
            isActive
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/30'
              : 'text-slate-400 hover:bg-white/8 hover:text-white'
          }`
        }
      >
        <Icon className="h-5 w-5" />
        <span className="mt-1 leading-none">{label}</span>
      </NavLink>
    ))}
  </nav>

  <div className="mt-6 rounded-full border border-white/10 px-2 py-1 text-[10px] text-slate-500">
    v0.1
  </div>
</aside>
```

- [ ] **Step 3: Run focused typecheck**

Run:

```bash
pnpm --filter @app/desktop typecheck
```

Expected: command exits 0.

- [ ] **Step 4: Commit sidebar**

```bash
git add apps/desktop/src/renderer/components/ui/sidebar.tsx
git commit -m "feat: refresh sidebar branding"
```

---

### Task 3: Refresh Writing Entry Form

**Files:**
- Modify: `apps/desktop/src/renderer/components/writing/WritingForm.tsx`

- [ ] **Step 1: Update the outer wrapper and header**

In `WritingForm`, change the top wrapper to:

```tsx
<div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
```

Change the first header container to:

```tsx
<div className="flex items-end justify-between gap-6">
```

Change the eyebrow and title classes to:

```tsx
className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600"
className="mt-2 text-4xl font-semibold tracking-tight text-slate-950"
```

Change the type pill class to:

```tsx
className="flex items-center gap-2 rounded-full border border-blue-100 bg-white/90 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm"
```

- [ ] **Step 2: Upgrade the composer card**

Change the main card class from:

```tsx
className="rounded-lg border border-slate-200 bg-white shadow-sm"
```

to:

```tsx
className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/60"
```

Change the topic textarea class to:

```tsx
className="min-h-44 w-full resize-none border-0 bg-transparent text-base leading-8 text-slate-800 outline-none placeholder:text-slate-400"
```

Change starter prompt button class to:

```tsx
className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
```

- [ ] **Step 3: Upgrade controls and footer**

For all select and number input elements in this file, use this class:

```tsx
className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
```

Change the controls grid class to:

```tsx
className="grid grid-cols-2 gap-4 border-b border-slate-100 bg-slate-50/40 p-5 lg:grid-cols-5"
```

Change the footer class to:

```tsx
className="flex items-center justify-between gap-3 bg-white p-5"
```

Change the start button class to:

```tsx
className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
```

- [ ] **Step 4: Run writing form typecheck**

Run:

```bash
pnpm --filter @app/desktop typecheck
```

Expected: command exits 0.

- [ ] **Step 5: Commit writing form**

```bash
git add apps/desktop/src/renderer/components/writing/WritingForm.tsx
git commit -m "feat: refresh writing composer"
```

---

### Task 4: Refresh Writing Workbench Panels

**Files:**
- Modify: `apps/desktop/src/renderer/pages/Writing.tsx`
- Modify: `apps/desktop/src/renderer/components/writing/WritingPlanPanel.tsx`
- Modify: `apps/desktop/src/renderer/components/writing/WritingOutput.tsx`
- Modify: `apps/desktop/src/renderer/components/writing/WritingPlanEditor.tsx`

- [ ] **Step 1: Update `WritingPage` shell and header**

In `WritingPage`, change the top wrapper class to:

```tsx
className="flex min-h-full flex-col bg-[#eef4fb] text-slate-950"
```

Change the header class to:

```tsx
className="border-b border-white/70 bg-white/80 px-8 py-5 shadow-sm shadow-slate-200/60 backdrop-blur"
```

Change the header eyebrow class to:

```tsx
className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600"
```

Change the header title class to:

```tsx
className="mt-1 text-2xl font-semibold tracking-tight"
```

Change the workbench grid class to:

```tsx
className="grid min-h-[calc(100vh-81px)] grid-cols-[320px_minmax(0,1fr)_300px] gap-6 px-6 py-6"
```

- [ ] **Step 2: Update `WritingPage` side cards and actions**

For the planning placeholder card and the `Run` card, use:

```tsx
className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/60"
```

For primary action buttons in `WritingPage`, use:

```tsx
className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
```

For secondary action buttons in `WritingPage`, use:

```tsx
className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
```

Keep button handlers unchanged.

- [ ] **Step 3: Refresh `WritingPlanPanel` cards**

In `WritingPlanPanel`, update these classes:

```tsx
<div className="space-y-5">
<p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Plan</p>
<h2 className="mt-1 text-lg font-semibold text-slate-950">写作计划</h2>
```

Use this class for goal and audience cards:

```tsx
className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/60"
```

Use this inactive section card class:

```tsx
'rounded-2xl border bg-white p-4 shadow-sm shadow-slate-200/50 transition-colors'
```

Keep active card condition, but change active styling to:

```tsx
isActive ? 'border-blue-300 bg-blue-50/70 ring-2 ring-blue-100' : 'border-slate-200/80'
```

- [ ] **Step 4: Refresh `WritingOutput`**

In `WritingOutput`, use:

```tsx
className="rounded-2xl border border-slate-200/80 bg-white shadow-lg shadow-slate-200/60"
```

for final output articles. Use:

```tsx
className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-white/80 shadow-sm shadow-slate-200/60"
```

for the empty state. Use:

```tsx
className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-500"
```

for the progress bar fill. Keep markdown parsing and rendering logic unchanged.

- [ ] **Step 5: Refresh `WritingPlanEditor`**

In `WritingPlanEditor`, change the outer card class to:

```tsx
className="rounded-2xl border border-slate-200/80 bg-white shadow-lg shadow-slate-200/60"
```

For textarea and input elements, use rounded-xl, slate-50 background, and this focus treatment:

```tsx
focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100
```

Change the add-section button to a rounded-xl secondary button:

```tsx
className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
```

- [ ] **Step 6: Run writing tests and typecheck**

Run:

```bash
pnpm --filter @app/desktop typecheck
pnpm test -- apps/desktop/src/renderer/components/writing apps/desktop/src/renderer/pages/writing-navigation.test.ts
```

Expected: typecheck exits 0 and the focused tests pass.

- [ ] **Step 7: Commit workbench refresh**

```bash
git add apps/desktop/src/renderer/pages/Writing.tsx apps/desktop/src/renderer/components/writing/WritingPlanPanel.tsx apps/desktop/src/renderer/components/writing/WritingOutput.tsx apps/desktop/src/renderer/components/writing/WritingPlanEditor.tsx
git commit -m "feat: refresh writing workbench"
```

---

### Task 5: Refresh Knowledge Pages

**Files:**
- Modify: `apps/desktop/src/renderer/pages/Knowledge.tsx`
- Modify: `apps/desktop/src/renderer/pages/KnowledgeDetail.tsx`
- Modify: `apps/desktop/src/renderer/components/knowledge/KnowledgeCard.tsx`

- [ ] **Step 1: Update `KnowledgePage` imports**

Add lucide icons:

```tsx
import { Database, Plus, Search } from 'lucide-react';
```

Keep existing React, store, and `KnowledgeCard` imports.

- [ ] **Step 2: Replace `KnowledgePage` outer layout**

Use:

```tsx
<div className="min-h-full bg-[#eef4fb] px-8 py-8 text-slate-950">
  <div className="mx-auto max-w-5xl space-y-6">
```

Replace the page header with a flex header containing:

- Eyebrow text `Knowledge Base` using `text-xs font-semibold uppercase tracking-[0.2em] text-blue-600`
- Title `知识库` using `mt-1 text-3xl font-semibold tracking-tight`
- Description `管理可供写作 Agent 检索的本地资料。` using `mt-2 text-sm text-slate-500`
- New knowledge base button using `rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700`

- [ ] **Step 3: Restyle create form and empty state**

Use a create panel class:

```tsx
className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/60"
```

Use this input class for both fields:

```tsx
className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
```

Use an empty state panel:

```tsx
className="rounded-2xl border border-dashed border-blue-200 bg-white/80 px-6 py-14 text-center text-slate-500 shadow-sm shadow-slate-200/60"
```

Inside it, render `Database` in a blue icon circle and text `暂无知识库`.

- [ ] **Step 4: Refresh `KnowledgeCard`**

Change the outer card to:

```tsx
className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/60 transition hover:border-blue-200 hover:shadow-md hover:shadow-blue-100/60"
```

Wrap the `Folder` icon in:

```tsx
<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
  <Folder className="h-5 w-5" />
</div>
```

Keep delete and manage handlers unchanged.

- [ ] **Step 5: Refresh `KnowledgeDetailPage`**

Use the same `min-h-full bg-[#eef4fb] px-8 py-8` outer layout. Restyle:

- Back button: `mb-5 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700`
- Upload button: `rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700`
- Upload progress: `rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700`
- Document row: `rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-sm shadow-slate-200/60`

Keep `uploadDocument`, `deleteDocument`, and status label logic unchanged.

- [ ] **Step 6: Run knowledge checks**

Run:

```bash
pnpm --filter @app/desktop typecheck
```

Expected: command exits 0.

- [ ] **Step 7: Commit knowledge refresh**

```bash
git add apps/desktop/src/renderer/pages/Knowledge.tsx apps/desktop/src/renderer/pages/KnowledgeDetail.tsx apps/desktop/src/renderer/components/knowledge/KnowledgeCard.tsx
git commit -m "feat: refresh knowledge pages"
```

---

### Task 6: Refresh History Page

**Files:**
- Modify: `apps/desktop/src/renderer/pages/History.tsx`

- [ ] **Step 1: Add icons**

Add:

```tsx
import { FileClock, FileText } from 'lucide-react';
```

- [ ] **Step 2: Replace page shell and header**

Use:

```tsx
<div className="min-h-full bg-[#eef4fb] px-8 py-8 text-slate-950">
  <div className="mx-auto max-w-5xl space-y-6">
```

Render a header with:

- Eyebrow `History`
- Title `写作历史`
- Description `查看已生成、修订和导出的写作项目。`

- [ ] **Step 3: Restyle empty and list states**

Empty state:

```tsx
<div className="rounded-2xl border border-dashed border-blue-200 bg-white/80 px-6 py-14 text-center text-slate-500 shadow-sm shadow-slate-200/60">
  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
    <FileClock className="h-5 w-5" />
  </div>
  <p className="mt-3 text-sm font-medium text-slate-700">暂无写作记录</p>
  <p className="mt-1 text-xs text-slate-500">完成一次写作后会在这里出现。</p>
</div>
```

Project card class:

```tsx
className="w-full rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-sm shadow-slate-200/60 transition hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-md hover:shadow-blue-100/60"
```

Keep navigation handler unchanged.

- [ ] **Step 4: Run history checks**

Run:

```bash
pnpm --filter @app/desktop typecheck
```

Expected: command exits 0.

- [ ] **Step 5: Commit history refresh**

```bash
git add apps/desktop/src/renderer/pages/History.tsx
git commit -m "feat: refresh history page"
```

---

### Task 7: Align Settings Page Styling

**Files:**
- Modify: `apps/desktop/src/renderer/pages/Settings.tsx`

- [ ] **Step 1: Update page shell and header**

Change the outer wrapper to:

```tsx
<div className="min-h-full bg-[#eef4fb] text-slate-950">
```

Change the header class to:

```tsx
className="border-b border-white/70 bg-white/80 px-8 py-5 shadow-sm shadow-slate-200/60 backdrop-blur"
```

Change the title to `text-2xl font-semibold tracking-tight`.

- [ ] **Step 2: Align settings section buttons**

Change section button base class to:

```tsx
'flex w-full items-start gap-3 rounded-2xl border p-4 text-left shadow-sm shadow-slate-200/50 transition-colors'
```

Change active styling to:

```tsx
'border-blue-300 bg-white ring-2 ring-blue-100'
```

Change inactive styling to:

```tsx
'border-slate-200/80 bg-white hover:border-blue-200 hover:bg-blue-50/50'
```

- [ ] **Step 3: Align `EndpointSettings` cards and controls**

In `EndpointSettings`, update provider preset card classes to use `rounded-2xl`, `border-slate-200/80`, and active `border-blue-300 bg-white ring-2 ring-blue-100`.

For Base URL, model, and API Key inputs, use:

```tsx
className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
```

For save button, use the blue primary action:

```tsx
className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
```

For test button, use rounded-xl secondary action with blue hover.

- [ ] **Step 4: Run settings checks**

Run:

```bash
pnpm --filter @app/desktop typecheck
```

Expected: command exits 0.

- [ ] **Step 5: Commit settings refresh**

```bash
git add apps/desktop/src/renderer/pages/Settings.tsx
git commit -m "feat: align settings styling"
```

---

### Task 8: Final Verification And Visual QA

**Files:**
- No planned source edits unless verification exposes a UI regression.

- [ ] **Step 1: Run full desktop typecheck**

Run:

```bash
pnpm --filter @app/desktop typecheck
```

Expected: command exits 0.

- [ ] **Step 2: Run renderer-related tests**

Run:

```bash
pnpm test -- apps/desktop/src/renderer
```

Expected: all renderer tests pass.

- [ ] **Step 3: Run build**

Run:

```bash
pnpm --filter @app/desktop build
```

Expected: command exits 0 and produces Electron build output under `apps/desktop/out`.

- [ ] **Step 4: Start the app for visual review**

Run:

```bash
pnpm --filter @app/desktop dev
```

Expected: Electron dev window opens without renderer errors. Keep the process running for browser or manual visual review, then stop it with `Ctrl+C`.

- [ ] **Step 5: Visual QA checklist**

Inspect:

- Writing homepage: sidebar icon visible, composer prominent, five controls wrap cleanly.
- Writing workbench: three columns fit, progress/status panels are readable, buttons are still wired.
- Knowledge page: create form, empty state, and cards use the new style.
- Knowledge detail: upload button, progress banner, document rows, and status tags are readable.
- History page: empty and card states are consistent with knowledge page.
- Settings page: provider cards, inputs, saved models, and test result pill align with the new style.

- [ ] **Step 6: Commit final fixes if needed**

If visual QA requires fixes:

```bash
git add apps/desktop/src/renderer
git commit -m "fix: polish ui refresh details"
```

If no fixes are required, do not create an empty commit.

## Self-Review

- Spec coverage: tasks cover the app shell, sidebar, writing homepage, writing workbench, knowledge pages, history page, settings page, SVG icon, favicon, error/empty/loading visual states, and verification.
- Placeholder scan: no unresolved placeholder markers or undefined future tasks remain in this plan.
- Type consistency: all referenced files exist except the planned new `assets/app-icon.svg`; all logic references preserve existing handlers and store APIs.
