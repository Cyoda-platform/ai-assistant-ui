# Project Setup Instructions

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)

## Description
This project consists of both a web application and a desktop application.

## Requirements

Make sure you have the following software installed:

- **Node.js v22**: Install it from the [official Node.js download page](https://nodejs.org/en/download/package-manager).
- **Yarn v4**: Follow the [Yarn installation guide](https://yarnpkg.com/getting-started/install).
- **Install Dependencies**  
  Run the following command from the root folder to install all necessary dependencies:

```bash
  yarn
```

---

## Web

### Installation

To set up the project, follow these steps:

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

To set up the project, follow these steps:

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