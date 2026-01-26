# 🧪 План внедрения автоматизированного тестирования

## 📊 Текущее состояние

- **Покрытие тестами:** 0%
- **Всего файлов:** 270 (259 в web + 11 в desktop/desktop-workflow)
- **Компонентов:** 48+
- **Тестовые фреймворки:** Не установлены
- **Тестовые скрипты:** Отсутствуют

---

## 🎯 Цели

1. **Краткосрочные (1-2 недели):**
   - Настроить тестовую инфраструктуру
   - Написать тесты для критичных компонентов (20% покрытие)
   - Интегрировать тесты в CI/CD

2. **Среднесрочные (1-2 месяца):**
   - Покрыть тестами все критичные и важные компоненты (50% покрытие)
   - Добавить E2E тесты для основных user flows
   - Настроить автоматический запуск тестов при коммитах

3. **Долгосрочные (3-6 месяцев):**
   - Достичь 80%+ покрытия кода
   - Полное покрытие E2E тестами всех функций
   - Внедрить визуальное регрессионное тестирование

---

## 📋 Этап 1: Настройка инфраструктуры (1-2 дня)

### 1.1 Установка Vitest и Testing Library

```bash
cd packages/web
npm install -D vitest @vitest/ui @vitest/coverage-v8
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D jsdom happy-dom
```

**Зачем:**
- `vitest` - быстрый тестовый фреймворк для Vite
- `@vitest/ui` - веб-интерфейс для просмотра результатов
- `@vitest/coverage-v8` - генерация отчетов о покрытии
- `@testing-library/react` - тестирование React компонентов
- `jsdom` - эмуляция браузерного окружения

### 1.2 Создание конфигурации Vitest

**Файл:** `packages/web/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### 1.3 Создание setup файла

**Файл:** `packages/web/src/test/setup.ts`

```typescript
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() { return [] }
  unobserve() {}
}
```

### 1.4 Добавление тестовых скриптов

**Файл:** `packages/web/package.json`

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch"
  }
}
```

### 1.5 Обновление TypeScript конфигурации

**Файл:** `packages/web/tsconfig.app.json`

Добавить в `compilerOptions`:
```json
{
  "types": ["vitest/globals", "@testing-library/jest-dom"]
}
```

---

## 📋 Этап 2: Написание Unit тестов (1-2 недели)

### 2.1 Приоритет 1: Критичные компоненты (Неделя 1)

#### 2.1.1 AuthState (аутентификация)
**Файл:** `packages/web/src/components/AuthState/__tests__/AuthState.test.tsx`

**Тесты:**
- ✅ Отображение аватара пользователя
- ✅ Отображение имени пользователя
- ✅ Обработка состояния загрузки
- ✅ Обработка ошибок аутентификации
- ✅ Logout функциональность

#### 2.1.2 ChatBot (основной функционал)
**Файл:** `packages/web/src/components/ChatBot/__tests__/ChatBot.test.tsx`

**Тесты:**
- ✅ Рендеринг компонента
- ✅ Отправка сообщения
- ✅ Отображение истории сообщений
- ✅ Обработка ошибок при отправке
- ✅ Streaming сообщений
- ✅ Прикрепление файлов
- ✅ Markdown рендеринг сообщений
- ✅ Копирование сообщений в буфер обмена

#### 2.1.3 WorkflowCanvas (визуализация workflow)
**Файл:** `packages/web/src/components/WorkflowCanvas/__tests__/WorkflowCanvas.test.tsx`

**Тесты:**
- ✅ Рендеринг canvas
- ✅ Добавление узлов (nodes)
- ✅ Соединение узлов (edges)
- ✅ Удаление узлов и связей
- ✅ Валидация workflow
- ✅ Сохранение и загрузка workflow

#### 2.1.4 API Services (критичные сервисы)
**Файл:** `packages/web/src/services/__tests__/api.test.ts`

**Тесты:**
- ✅ Успешные запросы к API
- ✅ Обработка ошибок сети
- ✅ Retry логика
- ✅ Timeout обработка
- ✅ Авторизация (токены)
- ✅ Мокирование axios

#### 2.1.5 Zustand Stores (управление состоянием)
**Файлы:**
- `packages/web/src/stores/__tests__/chatStore.test.ts`
- `packages/web/src/stores/__tests__/workflowStore.test.ts`

**Тесты:**
- ✅ Инициализация store
- ✅ Обновление состояния
- ✅ Селекторы
- ✅ Асинхронные действия
- ✅ Persistence (localStorage)

---

### 2.2 Приоритет 2: Важные компоненты (Неделя 2)

#### 2.2.1 TaskDashboard
**Файл:** `packages/web/src/components/TaskDashboard/__tests__/TaskDashboard.test.tsx`

**Тесты:**
- ✅ Отображение списка задач
- ✅ Фильтрация задач
- ✅ Сортировка задач
- ✅ Создание новой задачи
- ✅ Обновление статуса задачи
- ✅ Удаление задачи

#### 2.2.2 ChatHistoryPanel
**Файл:** `packages/web/src/components/ChatHistoryPanel/__tests__/ChatHistoryPanel.test.tsx`

**Тесты:**
- ✅ Отображение истории чатов
- ✅ Поиск по истории
- ✅ Загрузка чата из истории
- ✅ Удаление чата
- ✅ Обновление списка (refresh)

#### 2.2.3 EnvironmentsPanel
**Файл:** `packages/web/src/components/EnvironmentsPanel/__tests__/EnvironmentsPanel.test.tsx`

**Тесты:**
- ✅ Отображение списка окружений
- ✅ Переключение между окружениями
- ✅ Отображение статуса окружения
- ✅ Обработка ошибок подключения

#### 2.2.4 LogViewer
**Файл:** `packages/web/src/components/LogViewer/__tests__/LogViewer.test.tsx`

**Тесты:**
- ✅ Отображение логов
- ✅ Фильтрация по уровню (info, warn, error)
- ✅ Поиск в логах
- ✅ Автоскролл
- ✅ Очистка логов

#### 2.2.5 ErrorBoundary
**Файл:** `packages/web/src/components/ErrorBoundary/__tests__/ErrorBoundary.test.tsx`

**Тесты:**
- ✅ Перехват ошибок рендеринга
- ✅ Отображение fallback UI
- ✅ Логирование ошибок
- ✅ Кнопка "Try again"

---

### 2.3 Приоритет 3: Вспомогательные компоненты (По мере необходимости)

#### 2.3.1 UI компоненты
- Header
- SideBar
- LoadingSpinner
- Modal
- Button
- Input

#### 2.3.2 Viewer компоненты
- FilePreview
- MarkdownRenderer
- CodeViewer

#### 2.3.3 List компоненты
- EntitiesList
- WorkflowsList
- RequirementsList

#### 2.3.4 Editor компоненты
- RequirementEditor
- WorkflowEditor
- CodeEditor

---

## 📋 Этап 3: Integration тесты (1 неделя)

### 3.1 Интеграция Chat + Workflow
**Файл:** `packages/web/src/__tests__/integration/chat-workflow.test.tsx`

**Тесты:**
- ✅ Создание workflow из чата
- ✅ Обновление workflow через чат
- ✅ Синхронизация состояния

### 3.2 Интеграция с API
**Файл:** `packages/web/src/__tests__/integration/api-integration.test.ts`

**Тесты:**
- ✅ Полный цикл CRUD операций
- ✅ Обработка ошибок API
- ✅ Retry и fallback механизмы

### 3.3 State Management Integration
**Файл:** `packages/web/src/__tests__/integration/state-management.test.ts`

**Тесты:**
- ✅ Синхронизация между stores
- ✅ Persistence и восстановление
- ✅ Оптимистичные обновления

---

## 📋 Этап 4: E2E тесты с Playwright (1-2 недели)

### 4.1 Установка Playwright

```bash
cd packages/web
npm install -D @playwright/test
npx playwright install
```

### 4.2 Конфигурация

**Файл:** `packages/web/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 4.3 E2E тест-сценарии

#### 4.3.1 Аутентификация
**Файл:** `packages/web/e2e/auth.spec.ts`

**Сценарии:**
- ✅ Успешный логин
- ✅ Logout
- ✅ Сохранение сессии
- ✅ Редирект на логин при отсутствии авторизации

#### 4.3.2 Chat Flow
**Файл:** `packages/web/e2e/chat.spec.ts`

**Сценарии:**
- ✅ Отправка сообщения и получение ответа
- ✅ Прикрепление файла
- ✅ Копирование сообщения
- ✅ Загрузка истории чатов
- ✅ Создание нового чата

#### 4.3.3 Workflow Flow
**Файл:** `packages/web/e2e/workflow.spec.ts`

**Сценарии:**
- ✅ Создание нового workflow
- ✅ Добавление узлов
- ✅ Соединение узлов
- ✅ Сохранение workflow
- ✅ Загрузка существующего workflow




---

## 📋 Этап 5: CI/CD интеграция (2-3 дня)

### 5.1 GitHub Actions Workflow

**Файл:** `.github/workflows/test.yml`

```yaml
name: Tests

on:
  push:
    branches: [main, develop, cyoda-ai-studio-3]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: |
          cd packages/web
          npm ci

      - name: Run unit tests
        run: |
          cd packages/web
          npm run test:ci

      - name: Run coverage
        run: |
          cd packages/web
          npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./packages/web/coverage/coverage-final.json
          flags: unittests
          name: codecov-umbrella
          fail_ci_if_error: true

      - name: Upload coverage reports
        uses: actions/upload-artifact@v3
        with:
          name: coverage-report
          path: packages/web/coverage

  e2e:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 20.x
          cache: 'npm'

      - name: Install dependencies
        run: |
          cd packages/web
          npm ci

      - name: Install Playwright Browsers
        run: |
          cd packages/web
          npx playwright install --with-deps

      - name: Run E2E tests
        run: |
          cd packages/web
          npm run test:e2e

      - name: Upload Playwright Report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: packages/web/playwright-report/
          retention-days: 30
```

### 5.2 Обновление package.json для CI

**Файл:** `packages/web/package.json`

Добавить скрипты:
```json
{
  "scripts": {
    "test:ci": "vitest run --reporter=verbose --reporter=json --outputFile=test-results.json",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

### 5.3 PR Quality Gates

**Файл:** `.github/workflows/pr-checks.yml`

```yaml
name: PR Quality Checks

on:
  pull_request:
    branches: [main, develop]

jobs:
  quality:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 20.x
          cache: 'npm'

      - name: Install dependencies
        run: |
          cd packages/web
          npm ci

      - name: Run tests with coverage
        run: |
          cd packages/web
          npm run test:coverage

      - name: Check coverage thresholds
        run: |
          cd packages/web
          npm run test:coverage:check

      - name: Comment PR with coverage
        uses: romeovs/lcov-reporter-action@v0.3.1
        with:
          lcov-file: ./packages/web/coverage/lcov.info
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### 5.4 Coverage Thresholds

**Файл:** `packages/web/vitest.config.ts`

Обновить конфигурацию:
```typescript
export default defineConfig({
  // ... existing config
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      thresholds: {
        lines: 20,      // Начальный порог 20%
        functions: 20,
        branches: 20,
        statements: 20,
      },
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/types.ts',
        '**/*.d.ts',
      ],
    },
  },
});
```

---

## 📋 Этап 6: Coverage Goals & Monitoring (Постоянно)

### 6.1 Краткосрочные цели (1-2 недели)

**Цель:** 20% покрытие

**Фокус:**
- ✅ Все критичные компоненты (Priority 1)
- ✅ Основные API сервисы
- ✅ Zustand stores
- ✅ Базовые E2E сценарии

**Метрики:**
- Lines: 20%
- Functions: 20%
- Branches: 15%
- Statements: 20%

### 6.2 Среднесрочные цели (1-2 месяца)

**Цель:** 50% покрытие

**Фокус:**
- ✅ Все Priority 1 и Priority 2 компоненты
- ✅ Все API сервисы
- ✅ Все stores
- ✅ Integration тесты
- ✅ Расширенные E2E сценарии

**Метрики:**
- Lines: 50%
- Functions: 50%
- Branches: 40%
- Statements: 50%

### 6.3 Долгосрочные цели (3-6 месяцев)

**Цель:** 80%+ покрытие

**Фокус:**
- ✅ Все компоненты
- ✅ Все утилиты и хелперы
- ✅ Все хуки
- ✅ Edge cases
- ✅ Полное E2E покрытие

**Метрики:**
- Lines: 80%
- Functions: 80%
- Branches: 70%
- Statements: 80%

### 6.4 Мониторинг и отчетность

#### 6.4.1 Codecov Integration

1. Зарегистрироваться на [codecov.io](https://codecov.io)
2. Подключить GitHub репозиторий
3. Добавить badge в README.md:

```markdown
[![codecov](https://codecov.io/gh/YOUR_ORG/YOUR_REPO/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_ORG/YOUR_REPO)
```

#### 6.4.2 Локальные отчеты

После запуска тестов с покрытием:
```bash
cd packages/web
npm run test:coverage
open coverage/index.html  # macOS
```

#### 6.4.3 Еженедельный мониторинг

**Создать скрипт:** `scripts/coverage-report.sh`

```bash
#!/bin/bash

echo "📊 Generating coverage report..."
cd packages/web
npm run test:coverage

echo ""
echo "📈 Current Coverage:"
cat coverage/coverage-summary.json | jq '.total'

echo ""
echo "✅ Report generated at: packages/web/coverage/index.html"
```

---

## 📚 Приложения

### Приложение A: Пример теста для ChatBot

**Файл:** `packages/web/src/components/ChatBot/__tests__/ChatBot.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatBot from '../ChatBot';
import { useChatStore } from '../../../stores/chatStore';

// Mock store
vi.mock('../../../stores/chatStore');

describe('ChatBot', () => {
  const mockSendMessage = vi.fn();
  const mockMessages = [
    { id: '1', role: 'user', content: 'Hello' },
    { id: '2', role: 'assistant', content: 'Hi there!' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useChatStore as any).mockReturnValue({
      messages: mockMessages,
      sendMessage: mockSendMessage,
      isLoading: false,
    });
  });

  it('should render chat messages', () => {
    render(<ChatBot />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('should send message when form is submitted', async () => {
    const user = userEvent.setup();
    render(<ChatBot />);

    const input = screen.getByPlaceholderText(/type a message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(input, 'Test message');
    await user.click(sendButton);

    expect(mockSendMessage).toHaveBeenCalledWith('Test message');
  });

  it('should disable input while loading', () => {
    (useChatStore as any).mockReturnValue({
      messages: mockMessages,
      sendMessage: mockSendMessage,
      isLoading: true,
    });

    render(<ChatBot />);

    const input = screen.getByPlaceholderText(/type a message/i);
    expect(input).toBeDisabled();
  });

  it('should handle file attachment', async () => {
    const user = userEvent.setup();
    render(<ChatBot />);

    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const fileInput = screen.getByLabelText(/attach file/i);

    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument();
    });
  });
});
```

### Приложение B: Пример теста для WorkflowCanvas

**Файл:** `packages/web/src/components/WorkflowCanvas/__tests__/WorkflowCanvas.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import WorkflowCanvas from '../WorkflowCanvas';

describe('WorkflowCanvas', () => {
  const mockOnSave = vi.fn();
  const mockNodes = [
    { id: '1', type: 'input', position: { x: 0, y: 0 }, data: { label: 'Start' } },
  ];
  const mockEdges = [];

  it('should render canvas with nodes', () => {
    render(
      <ReactFlowProvider>
        <WorkflowCanvas
          nodes={mockNodes}
          edges={mockEdges}
          onSave={mockOnSave}
        />
      </ReactFlowProvider>
    );

    expect(screen.getByText('Start')).toBeInTheDocument();
  });

  it('should call onSave when save button is clicked', () => {
    render(
      <ReactFlowProvider>
        <WorkflowCanvas
          nodes={mockNodes}
          edges={mockEdges}
          onSave={mockOnSave}
        />
      </ReactFlowProvider>
    );

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalled();
  });
});
```

### Приложение C: Пример теста для API Service

**Файл:** `packages/web/src/services/__tests__/api.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { fetchChatHistory, sendMessage } from '../api';

vi.mock('axios');

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchChatHistory', () => {
    it('should fetch chat history successfully', async () => {
      const mockData = [
        { id: '1', title: 'Chat 1' },
        { id: '2', title: 'Chat 2' },
      ];

      (axios.get as any).mockResolvedValue({ data: mockData });

      const result = await fetchChatHistory();

      expect(axios.get).toHaveBeenCalledWith('/api/chats');
      expect(result).toEqual(mockData);
    });

    it('should handle network errors', async () => {
      (axios.get as any).mockRejectedValue(new Error('Network error'));

      await expect(fetchChatHistory()).rejects.toThrow('Network error');
    });
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      const mockResponse = { id: '123', content: 'Response' };
      (axios.post as any).mockResolvedValue({ data: mockResponse });

      const result = await sendMessage('Hello');

      expect(axios.post).toHaveBeenCalledWith('/api/messages', {
        content: 'Hello',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should retry on timeout', async () => {
      (axios.post as any)
        .mockRejectedValueOnce({ code: 'ECONNABORTED' })
        .mockResolvedValueOnce({ data: { id: '123' } });

      const result = await sendMessage('Hello');

      expect(axios.post).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ id: '123' });
    });
  });
});
```

### Приложение D: Best Practices

#### 1. Именование тестов
- ✅ Используйте описательные имена: `should render user avatar when authenticated`
- ❌ Избегайте общих имен: `test 1`, `it works`

#### 2. Структура тестов (AAA Pattern)
```typescript
it('should do something', () => {
  // Arrange - подготовка
  const user = { name: 'John' };

  // Act - действие
  const result = formatUserName(user);

  // Assert - проверка
  expect(result).toBe('John');
});
```

#### 3. Моки и стабы
- ✅ Мокируйте внешние зависимости (API, localStorage)
- ✅ Используйте `vi.clearAllMocks()` в `beforeEach`
- ❌ Не мокируйте то, что тестируете

#### 4. Асинхронные тесты
```typescript
it('should load data', async () => {
  render(<Component />);

  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});
```

#### 5. Тестирование пользовательских взаимодействий
```typescript
import userEvent from '@testing-library/user-event';

it('should handle click', async () => {
  const user = userEvent.setup();
  render(<Button />);

  await user.click(screen.getByRole('button'));

  expect(mockHandler).toHaveBeenCalled();
});
```

### Приложение E: Полезные ресурсы

#### Документация
- 📚 [Vitest](https://vitest.dev/)
- 📚 [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- 📚 [Playwright](https://playwright.dev/)
- 📚 [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

#### Руководства
- 📖 [Common mistakes with React Testing Library](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- 📖 [Testing Implementation Details](https://kentcdodds.com/blog/testing-implementation-details)
- 📖 [Write tests. Not too many. Mostly integration.](https://kentcdodds.com/blog/write-tests)

#### Инструменты
- 🛠️ [Codecov](https://codecov.io/) - Coverage reporting
- 🛠️ [Testing Playground](https://testing-playground.com/) - Query selector helper
- 🛠️ [MSW](https://mswjs.io/) - API mocking

---

## 🎯 Заключение

Этот план предоставляет пошаговый подход к внедрению автоматизированного тестирования в проект. Начните с **Этапа 1** (настройка инфраструктуры), затем постепенно покрывайте тестами критичные компоненты, двигаясь от **Priority 1** к **Priority 3**.

**Ключевые принципы:**
- 🎯 Начинайте с самого важного
- 📈 Постепенно увеличивайте покрытие
- 🔄 Регулярно запускайте тесты
- 📊 Мониторьте метрики покрытия
- ✅ Поддерживайте качество тестов

**Следующие шаги:**
1. ✅ Установить Vitest и Testing Library
2. ✅ Написать первый тест для AuthState
3. ✅ Настроить CI/CD
4. ✅ Постепенно покрывать остальные компоненты

Удачи в тестировании! 🚀