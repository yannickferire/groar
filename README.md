# Groar

Turn your social media metrics into shareable visuals.

## Features

- Create beautiful metric cards for X (Twitter)
- Customize backgrounds and text colors
- Support for followers, impressions, replies, and engagement rate
- Export as high-quality PNG images
- Drag and drop to reorder metrics

## Tech Stack

- [Next.js 15](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [dnd-kit](https://dndkit.com/) - Drag and drop
- [html-to-image](https://github.com/bubkoo/html-to-image) - Image export

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
├── app/                  # Next.js app router
├── components/           # React components
│   ├── editor/          # Editor-specific components
│   ├── layout/          # Layout components (Header, Footer)
│   └── ui/              # UI primitives (shadcn/ui)
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
│   ├── backgrounds.ts   # Background presets
│   ├── date.ts          # Date formatting
│   ├── metrics.ts       # Metric parsing and formatting
│   ├── utils.ts         # General utilities
│   └── validation.ts    # Input validation
└── public/              # Static assets
```

## License

MIT
