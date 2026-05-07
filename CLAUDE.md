# AI Assistant UI — Context for Claude Code

## Что делаем

Переводим UI проекта `ai-assistant-ui` на стиль, консистентный с:
- **cyoda-launchpad** (`/Users/Victoria/PycharmProjects/cyoda-launchpad`) — React + Vite + Tailwind + shadcn/ui
- **cyodalight-website** — маркетинговый сайт Cyoda, light-first тема

Подробный style guide: `/Users/Victoria/PycharmProjects/ai-assistant-ui-victoria/STYLEBOOK.md`  
Cyoda Cloud style guide (в репо): `/Users/Victoria/PycharmProjects/ai-assistant-ui-victoria/cyoda-cloud-style-guide.md`

## Ветки

| Ветка | Назначение |
|---|---|
| `develop` | Эталон для **бэкенда и логики** — не трогаем логику, только смотрим как reference |
| `cyoda-cloud-workbench-ui-2` | **Рабочая ветка** — здесь ведём все UI-изменения |

Работаем в `cyoda-cloud-workbench-ui-2`. Коммиты и пуши — только по явному запросу.

## Ключевые принципы переделки

- **Light-first**: белые/светлые фоны (`#ffffff`, `#f8fafc`, `#f1f5f9`), тёмный текст
- **Основной акцент**: Cyoda Teal — `#4FB8B0` / `hsl(175 67% 52%)` для brand; `#1a8a84` / `hsl(175 65% 32%)` для интерактивных элементов на белом (WCAG)
- **Типографика**: Inter для UI, JetBrains Mono для кода
- **Без**: dark gradients, glassmorphism, neon glow, анимированных логотипов, shimmer
- **Иконки**: lucide-react, stroke-based, без fill

## Что можно менять безопасно

- `HomeView.tsx`, `NewChatView.tsx` — copy и визуальный стиль
- `Header.tsx` — только визуальный стиль
- `i18n/en.json` — лейблы
- CSS-переменные в `_variables-light.scss`
- `tailwind.css` — цвета, glassmorphism-классы, scrollbar
- Обёртки панелей, empty states, кнопки

## Что не трогаем

- `WorkflowCanvas/*`, `PortalCanvas/*`
- API clients, services, stores
- Auth0 / token management
- Streaming логика
- Resize handle логика
- React Flow и Monaco internals

## Структура проекта

```
packages/web/src/
  assets/css/particular/   ← SCSS-переменные и стили компонентов
  styles/tailwind.css       ← Tailwind-специфичные стили
  components/Header/        ← Шапка
  views/                    ← Страницы (HomeView, NewChatView, ChatBotView…)
  i18n/                     ← Локализация
```
