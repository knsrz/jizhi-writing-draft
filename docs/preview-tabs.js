(function initPreviewTabsBundle(root) {
  const PREVIEW_TABS = {
    plan: {
      id: 'plan',
      status: '正在生成年度工作总结',
      title: '先规划，再分段写作',
      prompt: '请结合部门项目资料，生成一篇正式、清晰、可提交的年度工作总结。',
      steps: [
        {
          index: '01',
          title: '梳理重点成果',
          body: '从知识库中提取项目进度、业务指标和关键事件。',
        },
        {
          index: '02',
          title: '分段生成正文',
          body: '按章节逐段起草，实时回传当前章节和完成进度。',
        },
        {
          index: '03',
          title: '事实校正与润色',
          body: '结合检索资料降低事实漂移，并统一正式文风。',
        },
      ],
      context: [
        {
          label: '知识库引用',
          title: '4 份资料命中',
          body: '项目周报、会议纪要、竞品报告、制度模板',
        },
        {
          label: '输出格式',
          title: 'Markdown / DOCX',
          body: '生成后可继续编辑、归档或提交。',
        },
      ],
    },
    knowledge: {
      id: 'knowledge',
      status: '正在索引项目资料',
      title: '让资料成为写作依据',
      prompt: '上传 PDF、DOCX、TXT 或 Markdown，本地解析、切片并检索相关内容。',
      steps: [
        {
          index: '01',
          title: '本地解析文档',
          body: '把制度、报告、会议纪要转换成可检索文本。',
        },
        {
          index: '02',
          title: '按语义切片',
          body: '围绕标题和段落组织资料，减少上下文污染。',
        },
        {
          index: '03',
          title: '检索写作证据',
          body: '生成前召回相关资料，让正文更贴近事实。',
        },
      ],
      context: [
        {
          label: '支持格式',
          title: 'PDF / DOCX / TXT / MD',
          body: '常见办公资料可以直接进入知识库。',
        },
        {
          label: '本地存储',
          title: 'SQLite + LanceDB',
          body: '元数据与向量索引都留在本机。',
        },
      ],
    },
    export: {
      id: 'export',
      status: '准备导出可交付文档',
      title: '从生成到交付一键闭环',
      prompt: '写作历史自动保存，完成后可导出 Markdown 或 DOCX 继续编辑。',
      steps: [
        {
          index: '01',
          title: '保存历史版本',
          body: '写作项目、生成结果和修订内容都会留痕。',
        },
        {
          index: '02',
          title: '导出 Markdown',
          body: '适合继续排版、归档或接入其他写作工具。',
        },
        {
          index: '03',
          title: '导出 DOCX',
          body: '面向办公提交场景，直接进入文档编辑流程。',
        },
      ],
      context: [
        {
          label: '版本记录',
          title: '自动保存',
          body: '回看每次生成和后续修订。',
        },
        {
          label: '交付格式',
          title: 'Markdown / DOCX',
          body: '覆盖草稿编辑和正式提交两类需求。',
        },
      ],
    },
    models: {
      id: 'models',
      status: '正在使用自配置模型',
      title: '主流 OpenAI 兼容接口',
      prompt: '写作模型和嵌入模型分开配置，API Key 写入系统安全存储。',
      steps: [
        {
          index: '01',
          title: '写作模型',
          body: '支持 OpenAI、Gemini、DeepSeek、阿里百炼等接口。',
        },
        {
          index: '02',
          title: '嵌入模型',
          body: '单独配置 embedding 服务，支撑知识库检索。',
        },
        {
          index: '03',
          title: '连接测试',
          body: '保存前验证接口可用，减少配置错误。',
        },
      ],
      context: [
        {
          label: '兼容接口',
          title: 'OpenAI Compatible',
          body: '也可接入 OpenRouter、SiliconFlow、Ollama。',
        },
        {
          label: '安全配置',
          title: '系统安全存储',
          body: 'API Key 不写入明文数据库。',
        },
      ],
    },
  };

  function setText(element, text) {
    if (element) {
      element.textContent = text;
    }
  }

  function setChildText(element, selector, text) {
    if (element) {
      setText(element.querySelector(selector), text);
    }
  }

  function setActiveButton(button, active) {
    if (active) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }

    button.setAttribute('aria-selected', active ? 'true' : 'false');
    button.tabIndex = active ? 0 : -1;
  }

  function activatePreviewTab(doc, tabKey) {
    const tab = PREVIEW_TABS[tabKey] ?? PREVIEW_TABS.plan;

    setText(doc.querySelector('[data-preview-status]'), tab.status);
    setText(doc.querySelector('[data-preview-title]'), tab.title);
    setText(doc.querySelector('[data-preview-prompt]'), tab.prompt);

    Array.from(doc.querySelectorAll('[data-preview-tab]')).forEach((button) => {
      setActiveButton(button, button.dataset.previewTab === tab.id);
    });

    Array.from(doc.querySelectorAll('[data-preview-step]')).forEach((stepElement, index) => {
      const step = tab.steps[index];

      if (!step) {
        return;
      }

      setChildText(stepElement, '[data-preview-step-index]', step.index);
      setChildText(stepElement, '[data-preview-step-title]', step.title);
      setChildText(stepElement, '[data-preview-step-body]', step.body);
    });

    Array.from(doc.querySelectorAll('[data-preview-context]')).forEach((contextElement, index) => {
      const context = tab.context[index];

      if (!context) {
        return;
      }

      setChildText(contextElement, '[data-preview-context-label]', context.label);
      setChildText(contextElement, '[data-preview-context-title]', context.title);
      setChildText(contextElement, '[data-preview-context-body]', context.body);
    });
  }

  function readSelectedState(button) {
    if (typeof button.getAttribute === 'function') {
      return button.getAttribute('aria-selected');
    }

    return button.attributes?.['aria-selected'];
  }

  function nextTabIndex(buttons, currentIndex, key) {
    if (key === 'Home') {
      return 0;
    }

    if (key === 'End') {
      return buttons.length - 1;
    }

    if (key === 'ArrowRight') {
      return (currentIndex + 1) % buttons.length;
    }

    if (key === 'ArrowLeft') {
      return (currentIndex - 1 + buttons.length) % buttons.length;
    }

    return currentIndex;
  }

  function initPreviewTabs(doc) {
    const rootDocument = doc ?? document;
    const buttons = Array.from(rootDocument.querySelectorAll('[data-preview-tab]'));

    if (buttons.length === 0) {
      return;
    }

    buttons.forEach((button, index) => {
      button.addEventListener('click', () => {
        activatePreviewTab(rootDocument, button.dataset.previewTab);
      });

      button.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
          return;
        }

        event.preventDefault();
        const nextButton = buttons[nextTabIndex(buttons, index, event.key)];
        nextButton.focus();
        activatePreviewTab(rootDocument, nextButton.dataset.previewTab);
      });
    });

    const selectedButton =
      buttons.find((button) => readSelectedState(button) === 'true') ?? buttons[0];
    activatePreviewTab(rootDocument, selectedButton.dataset.previewTab);
  }

  const api = {
    PREVIEW_TABS,
    activatePreviewTab,
    initPreviewTabs,
  };

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.JizhiPreviewTabs = api;

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => initPreviewTabs(document));
    } else {
      initPreviewTabs(document);
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
