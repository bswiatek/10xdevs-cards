# Generator Fiszek AI

## Table of Contents

- [Project Name](#project-name)
- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Name

**Generator Fiszek AI**

The project repository is named **10xdevs-cards**, and it contains a web application for automatically generating educational flashcards using AI.

## Project Description

Generator Fiszek AI is a web application designed to automate the creation of educational flashcards. It allows users to input text (ranging from 1000 to 10000 characters) and leverages AI models (such as GPT-4o or Claude 3.5 Sonnet) to generate candidate flashcards. Users can review, edit, or accept the generated flashcards, ensuring high quality while saving time in the content creation process.

Key features include:

- Automated generation of flashcards from a given text input.
- Real-time character count validation on the client and server sides.
- Three-tier candidate review process: accept, edit, or reject generated content.
- Flashcard formatting constraints (front: max 200 characters; back: max 500 characters).
- Error handling with timeout management and retry capabilities.

## Tech Stack

The project is built using the following technologies:

### Core Technologies

- **Astro 5**: A modern web framework used for creating fast, content-focused websites with SSR capabilities.
- **React 19**: For dynamic and interactive UI components.
- **TypeScript 5**: Provides static typing to improve code quality and maintainability.
- **Tailwind CSS 4**: Used for styling the application with utility-first CSS.
- **Shadcn/ui**: Integrated for pre-built UI components.
- **Node.js v22.14.0**: Runtime environment (as specified in `.nvmrc`).

### Backend & Services

- **Supabase**: Used for authentication, database management (PostgreSQL), and API endpoints.
- **OpenRouter**: AI integration layer for models such as GPT-4o or Claude 3.5 Sonnet.

### Testing Tools

- **Vitest + React Testing Library**: For unit and integration tests. Integrated with Vite/Astro environment, fast and efficient. RTL promotes testing from the user's perspective.
- **Playwright**: For end-to-end (E2E) tests. Modern and fast tool offering excellent browser control, API mocking, and test recording capabilities.
- **Storybook + Chromatic**: For visual regression testing. Storybook for isolated UI component development, Chromatic for automated visual testing and regression detection.
- **k6 (Grafana)**: For performance and load testing. Modern tool written in JavaScript, easy to integrate in CI/CD pipelines.

## Getting Started Locally

### Prerequisites

- Node.js version as specified in `.nvmrc` (v22.14.0 recommended)
- npm package manager

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/bswiatek/10xdevs-cards.git
   cd 10xdevs-cards
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

The application should now be running on [http://localhost:3000](http://localhost:3000) (default Astro port).

## Available Scripts

In the project directory, you can run:

- `npm run dev`: Starts the Astro development server.
- `npm run build`: Builds the project for production.
- `npm run preview`: Serves the production build locally.
- `npm run astro`: Runs Astro CLI commands.
- `npm run lint`: Runs ESLint to check code quality.
- `npm run lint:fix`: Fixes ESLint errors automatically.
- `npm run format`: Formats the code using Prettier.

## Project Scope

The application aims to streamline the process of generating educational flashcards by automating candidate creation using AI, while allowing for user review and edits. It covers the following functional areas:

- **Flashcard Generation**: Importing text, processing it using AI, and generating flashcard candidates.
- **Candidate Review Interface**: Allowing users to accept, reject, or modify generated flashcards.
- **Manual Flashcard Creation**: Providing tools for users to manually create and edit flashcards.
- **Learning Module**: Integrating the FSRS algorithm for scheduling flashcard reviews.
- **User Account Management**: Supporting registration, login, and session management (with plans to integrate more security features).

## Project Status

Current version: **0.0.1**

This project is in the early MVP phase. Core functionalities for flashcard generation and review are implemented, with plans to enhance the backend integration and security features in future updates.

## License

This project is licensed under the MIT License.
