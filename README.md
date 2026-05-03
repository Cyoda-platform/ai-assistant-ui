# Cyoda Cloud UI monorepo

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)

## Description

This is the Cyoda Cloud UI monorepo. It contains the web application that serves as the public product entry point and developer environment for [Cyoda Cloud](https://cyoda.net/) — the hosted Cyoda runtime for developers building event-driven, stateful systems with lifecycle workflows and traceable history.

## Requirements

Make sure you have the following software installed:

- **Node.js v22**: Install it from the [official Node.js download page](https://nodejs.org/en/download/package-manager).
- **Yarn v4**: Follow the [Yarn installation guide](https://yarnpkg.com/getting-started/install).
- **Install Dependencies**  
  Run the following command from the root folder to install all necessary dependencies:

```bash
  yarn
```

See [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md) for detailed setup with Corepack (required if you have Yarn 1.x installed via Homebrew).

---

## Packages

| Package | Description |
|---------|-------------|
| `packages/web` | React web application for Cyoda Cloud. |
| `packages/desktop` | Electron desktop application. Out of scope for this rebrand unless shared assets are affected. |
| `packages/desktop-workflow` | Electron workflow editor. Out of scope for this iteration. |

---

## Web

### Installation

To set up the project, navigate to the **packages/web** folder and follow these steps:

1. **Create Environment File**  
   Copy the `.env.template` file to `.env` and set the appropriate configuration values.

2. **Start the Application**
- For local development:
```bash
  yarn dev
 ```
- For production deployment:
```bash
  yarn build
```

---

## Desktop

### Installation

To set up the project, navigate to the **packages/desktop** folder and follow these steps:

1. **Create Environment File**  
   Copy the `.env.template` file to `.env` and set the appropriate configuration values.

2. **Start the Application**
- For local development:
 ```bash
    yarn dev
 ```
- For production deployment:
```bash
  yarn make
```

---

## Known Issues

If you download the desktop application from GitHub releases and see messages about a "damaged application" on **macOS**, run the following command:

```
  xattr -c <path to your app>
```

Afterward, the application should open correctly.

---

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](./LICENSE) file for details.

- Certain images in this project are sourced from Freepik under their Premium License and are not covered by the project's open source licence. If Freepik assets are removed from the public landing page in a future change, this note will be updated accordingly.
- Some icons are still the property of Webalys LLC ([https://streamlinehq.com](https://streamlinehq.com)) and can be used only in the context of the open-source project.
