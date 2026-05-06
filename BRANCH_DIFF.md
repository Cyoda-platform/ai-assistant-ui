# Сравнение веток: cyoda-cloud-workbench-ui vs develop

> **Соглашение по знакам в диффах:**
> - строки с `-` — это код в ветке `cyoda-cloud-workbench-ui` (новый UI)
> - строки с `+` — это код в ветке `develop` (базовая ветка)

---

## Резюме

Ветка `cyoda-cloud-workbench-ui` представляет собой **ребрендинг и переоформление** приложения: светлая тема заменена на тёмную (dark mode), брендинг «Cyoda Cloud» заменён на «CYODA AI» / «CYODA AI Studio», и была проведена масштабная переработка компонентов. **Функциональных поломок при этом допущено несколько критичных:** упрощённый LoginButton потерял логику обработки ошибок и состояния загрузки; система переводов лишилась `deepMerge` (серверные переводы теперь полностью перезаписывают локальные вместо слияния); FintechHomeView превращена в практически полную копию HomeView с удалением Google Analytics и специфической маркетинговой логики; шрифты Inter/JetBrains Mono удалены из tailwind.config.

**Дополнение (найдено при глубоком анализе):** `App.tsx` тоже изменился (не попал в первоначальный список — diff stat был обрезан): изменена логика редиректа после логина, удалён автоматический редирект авторизованных пользователей с `/` на `/home`, удалён CSS-класс `marketing-page`. Ключевая находка: `ChatBotView.tsx` использует светлый фон `bg-slate-50` при тёмной теме всего приложения — вероятная причина того, что чат выглядит «пустым» (ответы рендерятся, но цвета конфликтуют).

---

## 1. Роутинг и навигация

**Файл:** `packages/web/src/router/index.tsx`

### Удалены lazy-загрузка и Suspense-обёртки

В `cyoda-cloud-workbench-ui` все вьюхи загружаются через `React.lazy()` + `<Suspense fallback={<LoadingSpinner />}>`:
```tsx
// cyoda-cloud-workbench-ui (новый UI):
const HomeView = lazy(() => import('@/views/HomeView'));
const ChatBotView = lazy(() => import('@/views/ChatBotView'));
// и т.д. для всех 10 вьюх
element: <Suspense fallback={<Fallback />}><HomeView /></Suspense>
```

В `develop` все вьюхи — **статические импорты**:
```tsx
// develop (baseline):
import HomeView from '@/views/HomeView';
import ChatBotView from '@/views/ChatBotView';
// и т.д.
element: <HomeView />
```

**Влияние:** В ветке `cyoda-cloud-workbench-ui` при первом рендере каждой вьюхи будет отображаться спиннер загрузки. В `develop` нет code splitting — весь бандл грузится сразу. `FintechHomeView` в обеих ветках загружается **статически** (это landing page), что правильно для быстрой первой отрисовки.

### Структура маршрутов

Сами маршруты (`/home`, `/chat/:technicalId`, `/canvas-demo`, `/workflows`, `/environments` и т.д.) **не изменились** — изменился только способ их загрузки.

---

## 2. Стор состояния (stores/app.ts)

**Файл:** `packages/web/src/stores/app.ts`

### Принудительный тёмный режим

В `cyoda-cloud-workbench-ui` тема жёстко зафиксирована на `'dark'`:
```ts
// cyoda-cloud-workbench-ui:
theme: 'dark', // Always dark mode - light mode not supported

setTheme(theme: string) {
  // Always enforce dark mode
  set({ theme: 'dark' });
  helperStorage.set("app:theme", 'dark');
}
```

В `develop` тема читается из localStorage и может быть `'light'` по умолчанию:
```ts
// develop:
theme: helperStorage.get('app:theme', 'light') as string,

setTheme(theme: string) {
  set({ theme });
  helperStorage.set("app:theme", theme);
}
```

**Влияние:** В `cyoda-cloud-workbench-ui` нет возможности переключиться на светлую тему ни через UI, ни программно. Если где-то в коде вызывается `setTheme('light')`, это не будет иметь эффекта.

---

## 3. App.tsx — логика после логина и темы

**Файл:** `packages/web/src/App.tsx` *(не был включён в первоначальный список — diff stat был обрезан)*

### Редирект после логина

В `cyoda-cloud-workbench-ui` после успешного логина через Auth0:
```tsx
const storedReturnTo = helperStorage.get<string>(LOGIN_REDIRECT_URL, APP_ENTRY_ROUTE); // default '/home'
const returnTo = !storedReturnTo || storedReturnTo === '/' ? APP_ENTRY_ROUTE : storedReturnTo;
```
Константа `APP_ENTRY_ROUTE = '/home'`. Если в localStorage ничего нет или хранится `/` — редиректит на `/home`.

В `develop` логика упрощена:
```tsx
const returnTo = helperStorage.get(LOGIN_REDIRECT_URL, '/');
```
После логина редиректит на `/` (там теперь живёт полноценный чат-интерфейс — копия HomeView).

### Удалён автоматический редирект авторизованных пользователей с `/`

В `cyoda-cloud-workbench-ui` есть эффект, который перебрасывает залогиненного пользователя с `/` на `/home`:
```tsx
useEffect(() => {
  if (auth0Loading || !isAuthenticated || location.pathname !== '/' || isAuth0Callback) return;
  navigate(APP_ENTRY_ROUTE, { replace: true }); // → '/home'
}, [...]);
```
В `develop` этот эффект **удалён** — авторизованный пользователь может оставаться на `/` (там теперь сам чат).

### Удалён эффект класса `marketing-page`

В `cyoda-cloud-workbench-ui` при посещении `/` на `<html>` вешался класс `marketing-page` (для отдельных CSS-переменных лендинга). В `develop` удалён вместе с лендингом.

### `helperStorage` и зависимости эффекта

- `cyoda-cloud-workbench-ui`: `helperStorage` создаётся через `useMemo(() => new HelperStorage(), [])` и входит в deps массив auth-эффекта
- `develop`: `helperStorage` создаётся напрямую (`new HelperStorage()`) **без** `useMemo`, из deps массива убран

Функционально различие не критично, но в `develop` `helperStorage` пересоздаётся на каждый рендер (потенциальная потеря производительности, не баг).

---

### Header.tsx

**Файл:** `packages/web/src/components/Header/Header.tsx`

Все изменения — **исключительно визуальные** (цвет фона, цветовая палитра кнопок). Функциональных изменений нет, за исключением:

1. **Изменение заголовка страницы (getPageTitle):**
   - `cyoda-cloud-workbench-ui`: возвращает `'Cyoda Cloud'`
   - `develop`: возвращает `'CYODA AI Assistant'`

2. **Изменение ссылки на GitHub:**
   - `cyoda-cloud-workbench-ui`: `https://github.com/Cyoda-platform/cyoda-go` (конкретный репозиторий)
   - `develop`: `https://github.com/Cyoda-platform` (организация целиком)

3. **Год копирайта в футере ChatHistoryPanel:**
   - `cyoda-cloud-workbench-ui`: `© 2026`
   - `develop`: `Copyright © 2025`

### LayoutModern.tsx

**Файл:** `packages/web/src/layouts/LayoutModern.tsx`

1. **Брендинг:**
   - `cyoda-cloud-workbench-ui`: текст `"Cyoda Cloud"` + бейдж `"BETA"`
   - `develop`: текст `"CYODA"` + бейдж `"ALPHA"`

2. **Плейсхолдер чата:**
   - `cyoda-cloud-workbench-ui`: `"Ask the AI assistant... (Ctrl+K to focus)"`
   - `develop`: `"Ask Cyoda AI Assistant... (Ctrl+K to focus)"`

---

## 4. Хедер и лейаут

## 5. Чат-компоненты

### ChatBot.tsx

**Файл:** `packages/web/src/components/ChatBot/ChatBot.tsx`

Изменения **только визуальные** (тёмный фон, цвета кнопок модального окна репозитория). Логика работы с репозиторием, функции `onAnswer`, обработка событий — **не изменились**.

### ChatBotSubmitForm.tsx

**Файл:** `packages/web/src/components/ChatBot/ChatBotSubmitForm.tsx`

1. **Плейсхолдер:**
   - `cyoda-cloud-workbench-ui`: `'Ask the assistant…'`
   - `develop`: `'Ask Cyoda AI Assistant...'`

2. **Цвет иконки отправки (функциональный код — комментарии на русском!):**
   - `cyoda-cloud-workbench-ui`: `'#94a3b8'` (неактивный) / `'#2563eb'` (активный)
   - `develop`: `'#0D8484'` (неактивный, с комментарием «темная бирюзовая - как логотип CYODA») / `'#14b8a6'` (активный)

3. **Цвет рамки при фокусе:**
   - `cyoda-cloud-workbench-ui`: `border-blue-500 ring-blue-500/20`
   - `develop`: `border-emerald-500 ring-emerald-500/20`

Остальные изменения — только цвета.

### ChatLoader.tsx

**Файл:** `packages/web/src/components/ChatBot/ChatLoader.tsx`

1. **Дефолтное сообщение при ожидании:**
   - `cyoda-cloud-workbench-ui`: `'Assistant is thinking…'`
   - `develop`: `'AI is thinking...'`

2. **Имя агента по умолчанию:**
   - `cyoda-cloud-workbench-ui`: `'Assistant'`
   - `develop`: `'CYODA AI'`

Остальные изменения — только визуальные.

### StreamingMessage.tsx

**Файл:** `packages/web/src/components/ChatBot/StreamingMessage.tsx`

1. **Имя агента по умолчанию:**
   - `cyoda-cloud-workbench-ui`: `'Assistant'`
   - `develop`: `'CYODA AI'`

2. **Описание ошибки в контексте ADK:**
   - `cyoda-cloud-workbench-ui`: `'Processing Error'`
   - `develop`: `'AI Processing Error'`

3. **Тип содержимого при стриминге:**
   - `cyoda-cloud-workbench-ui`: CSS-класс `prose` (стандартный светлый)
   - `develop`: CSS-класс `prose-invert prose` (инвертированный для тёмного фона)

   **Влияние:** Смотри также следующий пункт — CSS-конфликт в `ChatBotView`.

4. **Шрифт при стриминге:**
   - `cyoda-cloud-workbench-ui`: стандартный шрифт
   - `develop`: `font-mono` при стриминге (моноширинный)

### StreamErrorNotification.tsx

**Файл:** `packages/web/src/components/ChatBot/StreamErrorNotification.tsx`

1. **Текст ошибок (брендинг):**
   - `cyoda-cloud-workbench-ui`: упоминает «the assistant»
   - `develop`: упоминает «CYODA AI»

2. **Цвет иконки ADK-ошибки:**
   - `cyoda-cloud-workbench-ui`: `text-red-500`
   - `develop`: `text-purple-400`

3. **Цвет иконки дефолтной ошибки:**
   - `cyoda-cloud-workbench-ui`: `text-red-500`
   - `develop`: `text-pink-400`

Остальные изменения — только визуальные (красный → розовый/розово-фиолетовый).

### ChatBotMessageFunction.tsx

**Файл:** `packages/web/src/components/ChatBot/ChatBotMessageFunction.tsx`

1. **Лейбл бейджа функции:**
   - `cyoda-cloud-workbench-ui`: `"UI Function"` (нижний регистр)
   - `develop`: `"UI FUNCTION"` (верхний регистр)

2. **Кнопка Execute:**
   - `cyoda-cloud-workbench-ui`: синяя (`bg-blue-600`)
   - `develop`: фиолетово-индиго градиент (`from-purple-500 to-indigo-600`)

Остальное — визуальные изменения для тёмной темы.

### ChatBotMessageNotification.tsx

**Файл:** `packages/web/src/components/ChatBot/ChatBotMessageNotification.tsx`

1. **Лейблы типов уведомлений:**
   - `cyoda-cloud-workbench-ui`: `"Code Changes"`, `"Background Task"`, `"Notification"`
   - `develop`: `"CODE CHANGES"`, `"BACKGROUND TASK"`, `"CYODA NOTIFICATION"` (верхний регистр)

2. **Стили выбранных опций:**
   - `cyoda-cloud-workbench-ui`: синие (`border-blue-400 bg-blue-50`)
   - `develop`: бирюзовые (`border-teal-500 bg-teal-500/20`)

Остальное — визуальные изменения.

### ChatBotMessageQuestion.tsx

**Файл:** `packages/web/src/components/ChatBot/ChatBotMessageQuestion.tsx`

1. **Лейбл AI в бейдже:**
   - `cyoda-cloud-workbench-ui`: `'Canvas AI'` или `'Assistant'`
   - `develop`: `'CANVAS AI'` или `'CYODA AI'` (верхний регистр)

2. **Стили выбранных опций в вопросах:**
   - `cyoda-cloud-workbench-ui`: `border-blue-400 bg-blue-50`
   - `develop`: `border-amber-400/70 bg-teal-500/15`

Остальное — визуальные изменения для тёмной темы.

---

### ChatBotView.tsx — CSS-конфликт (вероятная причина пустого чата)

**Файл:** `packages/web/src/views/ChatBotView.tsx`

Это единственный функционально значимый diff в ChatBotView (4 строки):

```tsx
// cyoda-cloud-workbench-ui:
<div className="main-layout bg-slate-50 text-slate-900">

// develop:
<div className="main-layout bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white">
```

**Критический конфликт в `cyoda-cloud-workbench-ui`:**

- `App.tsx` принудительно добавляет класс `theme-dark` на `<html>` → компоненты внутри ожидают тёмный фон
- `ChatBot` и его дочерние компоненты (сообщения, аватары, фоны бабблов) стилизованы под тёмную тему
- Но контейнер `ChatBotView` задаёт **светлый фон** `bg-slate-50` и **тёмный текст** `text-slate-900`
- `StreamingMessage.tsx` использует `prose` (не `prose-invert`) — на светлом фоне текст виден, но цвета всей вёрстки вокруг будут конфликтовать

**Практическая диагностика:** если ответы от сервера приходят, но чат визуально выглядит пустым — проверить через DevTools → Network → запрос к `/v1/chats/{id}/stream`:
- **Статус 200, данные идут** → ответы рендерятся, но `text-slate-900` (тёмный текст) на компонентах, ожидающих тёмный фон, делает их невидимыми
- **Статус 401/403** → токен авторизации не передаётся
- **Запрос зависает** → проблема на стороне бэкенда или CORS

---

## 5. Панель истории чатов (ChatHistoryPanel)

**Файл:** `packages/web/src/components/ChatHistoryPanel/ChatHistoryPanel.tsx`

1. **Год копирайта в футере:**
   - `cyoda-cloud-workbench-ui`: `© 2026`
   - `develop`: `Copyright © 2025`

2. **Стиль активного элемента истории:**
   - `cyoda-cloud-workbench-ui`: `bg-blue-50 text-slate-900 border border-blue-200`
   - `develop`: `style={{ backgroundColor: 'rgba(20, 184, 166, 0.2)' }}` (inline style через JavaScript, не через Tailwind)

3. **Кнопка "New Chat":**
   - `cyoda-cloud-workbench-ui`: `bg-blue-600 hover:bg-blue-700`
   - `develop`: `bg-gradient-to-r from-teal-500 to-cyan-600` с тенью

Остальное — визуальные изменения для тёмной темы.

---

## 6. Панель окружений (EnvironmentsPanel, EnvironmentDetails)

**Файлы:** `packages/web/src/components/EnvironmentsPanel/EnvironmentsPanel.tsx`, `EnvironmentDetails.tsx`

Изменения — **исключительно визуальные** (тёмный фон, цветовая палитра кнопок и иконок: синий → бирюзовый). Функциональная логика (запросы к API, управление состоянием, кнопки Redeploy и т.д.) — **не изменилась**.

---

## 7. HomeView и FintechHomeView

### HomeView.tsx

**Файл:** `packages/web/src/views/HomeView.tsx`

1. **Удалён массив PROMPT_EXAMPLES:**
   - `cyoda-cloud-workbench-ui` содержал константу `PROMPT_EXAMPLES` прямо в файле
   - `develop` использует данные из i18n-переводов (через `t('examples.items.clickable')`)

2. **Добавлены новые зависимости в `develop`:**
   - Импорт `ppl1...ppl10` — 10 изображений людей (для секции отзывов / персон)
   - Импорт `CyodaLogo` (`cyoda_ai.png`) и `LogoSmall`
   - Импорт `ResizeHandle`, `LoadingSpinner`
   - Состояние `currentPromptIndex` (индекс для карусели примеров)

3. **Изменена логика создания чата при ошибке:**
   - `cyoda-cloud-workbench-ui`: `postChats(formData as any)` (as any)
   - `develop`: `postChats(formData)` (без принудительного приведения типа)

4. **Навигация при ошибке создания чата:**
   - `develop` явно добавил: `navigate('/', { replace: true })` — возврат на главную при ошибке

5. **Отображение примеров:**
   - `cyoda-cloud-workbench-ui`: простые кнопки-пилюли в `flex-wrap`
   - `develop`: Ant Design `<Row>/<Col>` в сетке с `<Button type="default">`

6. **Футер чата (NewChat):**
   - `cyoda-cloud-workbench-ui`: инлайн стили Tailwind
   - `develop`: CSS-классы без Tailwind (`new-chat__footer`)

### FintechHomeView.tsx

**Файл:** `packages/web/src/views/FintechHomeView.tsx`

Это наиболее масштабное изменение. В `cyoda-cloud-workbench-ui` FintechHomeView была **маркетинговой landing page** с:
- Интеграцией Google Analytics (`dataLayer`, функция `pushGA`)
- Статическим `WorkflowEditorPreviewPlaceholder`
- FAQ-секцией (`faqs`, `FAQItem`)
- Собственной логикой Auth0 (`useAuth0`, `loginWithRedirect`, `isAuthenticated`)
- Константой `APP_ENTRY_ROUTE = '/home'`
- Редиректом `returnTo: APP_ENTRY_ROUTE` при логине

В `develop` FintechHomeView фактически **стала копией HomeView** — с теми же импортами, теми же изображениями людей, теми же компонентами (ChatHistoryPanel, EnvironmentsPanel, Header). Вся специфическая маркетинговая логика **удалена**:
- Нет `useAuth0` / `loginWithRedirect`
- Нет `pushGA` и Google Analytics
- Нет `APP_ENTRY_ROUTE`
- Нет `WorkflowEditorPreviewPlaceholder`
- Нет FAQ

**Влияние:** Если в приложении есть маршрут, ведущий на FintechHomeView, в ветке `develop` пользователи увидят полноценный чат-интерфейс вместо landing page. Логика авторизации через кнопку на лендинге — **утрачена**.

---

## 8. Авторизация (LoginButton)

**Файл:** `packages/web/src/components/LoginButton/LoginButton.tsx`

Это одно из **критически важных функциональных изменений**.

### cyoda-cloud-workbench-ui (продвинутая версия):
```tsx
const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
const navigate = useNavigate();

const onClick = async (event) => {
  // Проверка состояния загрузки
  if (isLoading) return;
  // Если уже авторизован — навигация в /home
  if (isAuthenticated) {
    navigate('/home');
    return;
  }
  // Сохранение редиректа в storage
  helperStorage.set(LOGIN_REDIRECT_URL, '/home');
  localStorage.setItem('LOGIN_REDIRECT_URL', '/home');
  // Auth0 с appState
  await loginWithRedirect({
    appState: { returnTo: '/home' },
    authorizationParams: { prompt: 'login' }
  });
};
// Кнопка задизейблена во время загрузки: disabled={isLoading}
```

### develop (упрощённая версия):
```tsx
const { loginWithRedirect } = useAuth0();

const onClick = () => {
  helperStorage.set(LOGIN_REDIRECT_URL, '/');
  loginWithRedirect({
    authorizationParams: { prompt: 'login' }
  });
};
// Нет disabled, нет проверок, нет try/catch
```

**Ключевые потери в `develop`:**
1. Нет проверки `isLoading` — кнопка кликабельна пока Auth0 загружается
2. Нет проверки `isAuthenticated` — уже авторизованный пользователь заново пойдёт на логин
3. Нет `appState.returnTo` — Auth0 не сможет вернуть пользователя на нужную страницу после логина
4. URL редиректа изменён с `/home` на `/`
5. Нет `try/catch` — необработанные ошибки от `loginWithRedirect` всплывут наверх
6. Нет `useNavigate` — удалена зависимость от react-router
7. Нет `disabled={isLoading}` на кнопке

---

## 9. Новый чат (NewChat)

**Файл:** `packages/web/src/components/NewChat/NewChat.tsx`

1. **Добавлены новые Ant Design компоненты:**
   - `develop` добавил `Row`, `Col` из antd для grid-лейаута примеров

2. **Добавлена проверка iframe:**
   - `develop` импортирует `isInIframe` (хотя явного использования в diff не видно)

3. **Изменён стиль примеров:**
   - `cyoda-cloud-workbench-ui`: `<button>` с tailwind-классами
   - `develop`: `<Button type="default" className="new-chat__example-btn">` из Ant Design + `<Row>/<Col>`

4. **Изменены CSS-классы контейнеров:**
   - `cyoda-cloud-workbench-ui`: инлайн tailwind (`bg-white min-h-full`, `max-w-2xl mx-auto px-6 py-12`)
   - `develop`: BEM-классы (`new-chat__content`, `new-chat__header`, `new-chat__title` и т.д.)

5. **Изменено поле submit:**
   - `cyoda-cloud-workbench-ui`: `bg-blue-600` + tailwind классы
   - `develop`: только `className="new-chat__submit-btn"` (стили через CSS, не через Tailwind)

6. **Ссылка в футере:** убраны инлайн tailwind-классы, используются наследованные стили.

---

## 10. i18n / Переводы

### en.json

**Файл:** `packages/web/src/i18n/en.json`

| Ключ | cyoda-cloud-workbench-ui | develop |
|------|--------------------------|---------|
| `new_chat.h1` | `"Cyoda Cloud Workbench"` | `"BUILD WITH CYODA AI"` |
| `new_chat.h2` | `"Model entity lifecycles, generate workflows, connect processors, and inspect history on hosted Cyoda."` | `"Create complete applications with entities, workflows, and REST APIs using intelligent code generation"` |
| `new_chat.input.placeholder` | `"Describe the entity, workflow, or service you want to build."` | `"Build a customer management system, create entities, or deploy your environment..."` |
| `new_chat.title` | `"Start a Cyoda Cloud session"` | `"What would you like to build today?"` |
| `examples.items.readonly` | `"+100 different workflow types"` | `"+100 different application types"` |
| `examples.items.clickable[0]` | `"Model a trade settlement lifecycle"` | `"What is CYODA and how does it work?"` |
| `examples.items.clickable[1]` | `"Create a KYC onboarding workflow"` | `"Build a complete customer management system with CRUD operations..."` |
| `examples.items.clickable[2]` | `"Add an entity with lifecycle states"` | `"Create a simple task management app with Python"` |
| `examples.items.clickable[3]` | `"Connect a Java processor"` | `"Generate a Java application for inventory tracking..."` |
| `examples.items.clickable[4]` | `"Explain this workflow"` | `"Add a Customer entity with id, name, email, and phone fields"` |
| `examples.items.clickable[5]` | `"Generate a Python service stub"` | `"Create REST endpoints for Product entity with GET, POST, PUT, DELETE"` |

**Вывод:** В `cyoda-cloud-workbench-ui` примеры ориентированы на финтех/workflow-специфику Cyoda. В `develop` примеры переориентированы на общую разработку приложений (CRUD, REST API, Python/Java).

### plugins/i18n.ts — КРИТИЧЕСКОЕ ИЗМЕНЕНИЕ

**Файл:** `packages/web/src/plugins/i18n.ts`

В `cyoda-cloud-workbench-ui` реализована функция `deepMergeTranslations`, которая **сливает** серверные переводы с локальными (базовыми):
```ts
// cyoda-cloud-workbench-ui:
const deepMergeTranslations = (base, overrides) => { /* рекурсивное слияние */ };
// При загрузке:
return deepMergeTranslations(enJson, isPlainObject(data) ? data : {});
```

В `develop` эта функция **удалена**, и серверные переводы возвращаются напрямую:
```ts
// develop:
return data; // Просто возвращает серверные данные без слияния с en.json
```

**Влияние:** Если сервер возвращает частичные переводы (только изменённые ключи), в `develop` все остальные ключи из `en.json` будут **потеряны** — приложение получит пустые строки. В `cyoda-cloud-workbench-ui` это корректно обрабатывалось через deepMerge. При ошибке загрузки переводов оба варианта корректно возвращают `enJson`.

---

## 11. Тесты

### LoginButton.test.tsx

**Файл:** `packages/web/src/components/LoginButton/LoginButton.test.tsx`

1. **Удалены** `waitFor` и `fireEvent` импорты
2. **Удалены моки** `useNavigate`, `isAuthenticated`, `isLoading` — потому что в `develop` они не используются
3. **Изменён ожидаемый URL редиректа:** `/home` → `/`
4. **Удалён `appState.returnTo`** из ожидаемых аргументов `loginWithRedirect`
5. **Изменено поведение ошибки:**
   - `cyoda-cloud-workbench-ui`: `expect(() => fireEvent.click(button)).not.toThrow()` — ошибки перехватываются
   - `develop`: `expect(() => fireEvent.click(button)).toThrow('Auth0 error')` — ошибки **не перехватываются**, всплывают вверх

### LayoutModern.test.tsx

**Файл:** `packages/web/src/layouts/LayoutModern.test.tsx`

1. **Изменено ожидаемое брендирование:**
   - `cyoda-cloud-workbench-ui`: `'Cyoda Cloud'` + `'BETA'`
   - `develop`: `'CYODA'` + `'ALPHA'`

2. **Изменён плейсхолдер:** `'Ask the AI assistant'` → `'Ask Cyoda AI Assistant'`

### HomeView.test.tsx

**Файл:** `packages/web/src/views/HomeView.test.tsx`

1. **Изменён мок `useAssistantStore`:**
   - `cyoda-cloud-workbench-ui`: мокировал `chatList`, `chatListReady`, `isLoadingChats`, `isLoadingMoreChats`, `hasMoreChats`, `isTransferringChats`, `loadMoreChats`, `deleteChatById`
   - `develop`: мокирует только `chats`, `isLoading`, `fetchChats`, `createChat`, `getChats` — часть API стора **переименована или удалена**

2. **Изменён мок `useAuthStore`:**
   - `cyoda-cloud-workbench-ui`: `token: 'test-token'`, `useSuperUserMode: () => false`
   - `develop`: убрал `token`, `useSuperUserMode: () => ({ isSuperUser: false, toggleSuperUser: vi.fn() })` — другой формат возвращаемого значения

3. **Удалены моки:** `eventBus`, `HelperChatGroups`, `localStorageMock`

4. **Добавлены моки:** `ResizeHandle`, `LoadingSpinner`

5. **Удалён тест:** `'should not contain old AI Studio branding'` — тест проверял, что нет текстов `'Cyoda AI Studio'` и `'BUILD WITH CYODA AI'`. В `develop` второй текст **присутствует** (это новый заголовок h1 в en.json), поэтому тест удалён.

### AppsCanvas.tsx

**Файл:** `packages/web/src/components/AppsCanvas/AppsCanvas.tsx`

Единственное изменение: добавлен `// eslint-disable-next-line react-hooks/exhaustive-deps` в `useEffect`. Функционально это не меняет ничего, но **убирает ESLint-предупреждение** о зависимостях хука.

---

## 12. Tailwind конфигурация

**Файл:** `packages/web/tailwind.config.js`

В `cyoda-cloud-workbench-ui` объявлены кастомные шрифты:
```js
theme: {
  extend: {
    fontFamily: {
      sans: ['Inter', 'Arial', 'sans-serif'],
      mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
    },
  },
},
```

В `develop` эти шрифты **удалены** — используются системные шрифты Tailwind по умолчанию.

**Влияние:** В `develop` шрифты Inter и JetBrains Mono **не будут применяться** даже если они подключены в CSS. Монопространственный текст в ChatLoader (аргументы инструментов), StreamingMessage и других местах будет использовать системный моноширинный шрифт.

---

## 14. Заключение: что сломано или изменено в ветке develop относительно cyoda-cloud-workbench-ui

### Вероятная причина «пустого чата» в cyoda-cloud-workbench-ui

Весь код стриминга (`streamingService.ts`), стор авторизации (`auth.ts`) и стор ассистента (`assistant.ts`) **идентичны в обеих ветках** — логика отправки и получения SSE-событий не менялась.

Наиболее вероятные причины симптома «AI thinking есть, ответ не появляется»:

1. **CSS-конфликт в ChatBotView** (★ наиболее вероятно):
   - Контейнер чата в `cyoda-cloud-workbench-ui` имеет `bg-slate-50 text-slate-900` (светлый фон)
   - Компоненты сообщений (бабблы, аватары, разделители) стилизованы под тёмную тему
   - Ответы приходят, но рендерятся так, что текст сливается с фоном или компоненты не видны
   - **Проверка:** DevTools → Network → `/v1/chats/{id}/stream` — если запрос 200 и данные идут, причина в CSS

2. **Авторизация** (если запрос отдаёт 401/403):
   - Пользователь не прошёл через нормальный auth-flow
   - Токен в `authStore.token` пуст — стриминг-сервис передаёт `Bearer ` (пустой токен)

### Критические поломки в develop (относительно cyoda-cloud-workbench-ui):

1. **LoginButton — потеря логики авторизации:**
   - Пользователь с активной сессией Auth0 будет снова отправлен на страницу логина
   - Нет `appState.returnTo` → после логина Auth0 не вернёт на нужный маршрут
   - Необработанные исключения от `loginWithRedirect` крэшнут компонент
   - Кнопка не блокируется на время загрузки Auth0

2. **i18n deepMerge удалён:**
   - Если бэкенд возвращает только частичные переводы, в `develop` пропадут все остальные строки интерфейса
   - Требуется либо всегда возвращать полный словарь с бэкенда, либо вернуть deepMerge

3. **StreamingMessage — нечитаемый Markdown на тёмном фоне в develop:**
   - В `cyoda-cloud-workbench-ui` используется `prose` (светлая типографика) — некорректно для тёмного фона
   - В `develop` исправлено на `prose-invert prose` — правильно для тёмной темы

4. **FintechHomeView превращена в HomeView:**
   - Вся маркетинговая логика лендинга удалена
   - Google Analytics (`pushGA`, `dataLayer`) удалена
   - Если маршрут на FintechHomeView используется как публичный лендинг (до логина), он теперь показывает чат-интерфейс

5. **App.tsx: редирект после логина изменён:**
   - `cyoda-cloud-workbench-ui` → `/home`; `develop` → `/`
   - Удалён автоматический редирект авторизованных пользователей с `/` в `/home`

### Изменения поведения (не ломающие, но заметные):

6. **Lazy loading удалён:** в `develop` нет code splitting — весь JS грузится сразу

7. **Примеры запросов переориентированы:** с финтех/workflow на общую разработку приложений

8. **Шрифты Inter/JetBrains Mono удалены** из tailwind config

9. **Год копирайта:** `2026` → `2025`

10. **GitHub ссылка:** конкретный репозиторий `cyoda-go` → организация `Cyoda-platform`

11. **Лейблы сообщений AI** повсеместно изменены с `'Assistant'` на `'CYODA AI'`

12. **Брендинг:** `'Cyoda Cloud'` → `'CYODA'` / `'CYODA AI Assistant'`, бейдж `'BETA'` → `'ALPHA'`

13. **Тема принудительно dark** — `setTheme('light')` игнорируется

### Что осталось неизменным:

- Все API-эндпоинты и интеграции с бэкендом
- Структура роутов (сами пути)
- Вся логика чата (streaming, retry, error handling)
- Панель окружений (функциональность)
- Панель истории чатов (функциональность)
- Canvas/AppsCanvas (кроме eslint-комментария)
- Стор авторизации (auth store)
- Стор assistant
