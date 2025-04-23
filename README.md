# Neon Gemini 2.0 Flash

A modern chat interface for Gemini 2.0 Flash with image understanding capabilities.

## Features

- Clean, modern UI with a neon aesthetic
- Text chat with Gemini 2.0 Flash
- Image understanding (upload or drag & drop images)
- Clipboard paste support for images
- Optional image generation through Replicate API
- Responsive design for all devices

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Google Gemini API key (get one at [Google AI Studio](https://aistudio.google.com/))
- (Optional) Replicate API token for image generation

### Environment Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/neon-gemini-flash.git
   cd neon-gemini-flash
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory with your API keys:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   REPLICATE_API_TOKEN=your_replicate_token_here
   ```

### Running the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment on Vercel

The easiest way to deploy this app is to use the [Vercel Platform](https://vercel.com):

1. Push your code to a GitHub repository
2. Import the project in Vercel
3. Add the following environment variables in the Vercel project settings:
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `REPLICATE_API_TOKEN`: Your Replicate API token (if using image generation)
4. Deploy!

### Important Security Notes

- **Never commit your API keys to GitHub!** The `.env.local` file is in `.gitignore` for a reason.
- API keys are accessed via environment variables for security.
- The project uses Vercel's edge runtime for optimal performance.

## Project Structure

- `src/app`: Next.js App Router pages and API routes
- `src/components`: React components
- `src/lib`: Utility functions and context providers
- `public`: Static assets

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Gemini for the AI model
- Next.js and React for the framework
- Tailwind CSS for styling
- Vercel for hosting