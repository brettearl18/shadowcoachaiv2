# Shadow Coach AI v1

A comprehensive check-in platform for health coaches to monitor client progress.

## Features

- Customizable questionnaire builder
- Client progress tracking
- AI-powered analytics and reporting
- Integration with Google Sheets and Jotform
- Mobile-responsive design

## Tech Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- Firebase (Auth, Firestore, Storage, Functions)
- OpenAI API
- Chart.js
- React Query

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment variables:
   ```bash
   cp .env.example .env.local
   ```
4. Fill in your environment variables in `.env.local`
5. Run the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── app/              # Next.js app directory
├── components/       # Reusable components
├── lib/             # Utility functions and configurations
├── hooks/           # Custom React hooks
├── types/           # TypeScript type definitions
└── styles/          # Global styles
```

## Development Guidelines

- Follow TypeScript best practices
- Use functional components with hooks
- Implement proper error handling
- Write clean, maintainable code
- Follow the established project structure

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

Private - All rights reserved 