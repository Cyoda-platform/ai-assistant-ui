# Project Setup Instructions

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)

## Requirements

Make sure you have the following software installed:

- **Node.js v22**: Install it from the [official Node.js download page](https://nodejs.org/en/download/package-manager).
- **Yarn v4**: Follow the [Yarn installation guide](https://yarnpkg.com/getting-started/install).

## Installation

To set up the project, follow these steps:

1. **Create Environment File**  
   Copy the `.env.template` file to `.env` and set the appropriate configuration values.

2. **Install Dependencies**  
   Run the following command to install all necessary dependencies:

```bash
  yarn
```

3. **Start the Application**

- For local development, run:
```bash
   yarn dev
```
- For production deployment, run:

```bash
   yarn build
```
