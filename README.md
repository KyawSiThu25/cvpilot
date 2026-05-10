# CVpilot - CV Optimization Assistant

CVpilot is an intelligent, context-aware resume optimization assistant designed to help job seekers tailor their CVs to specific job requirements. Using advanced AI, it analyzes the user's professional background and the target job description to generate improved CV versions with relevant keywords, enhanced bullet points, and strategic formatting recommendations.

## 🚀 Features

### Core Features
- **✅ AI-Powered Job-to-CV Matching**: Analyzes both the user's CV and the job description to identify key requirements and skill gaps.
- **🎯 Resume Optimization**: Generates revised CV content optimized for Applicant Tracking Systems (ATS) and hiring managers.
- **📝 Context-Aware Content Generation**: Produces tailored bullet points, summaries, and skill suggestions based on the specific role.

### Key Functionalities
- **Document Processing**: Supports analysis of `.docx` and `.pdf` resume files.
- **Content Refinement**: Enhanced rewriting of bullet points to highlight achievements and match job requirements.
- **Score & Feedback**: Provides an ATS compatibility score and detailed feedback on improvements.
- **Version Control**: Maintains a history of all optimized CV versions with comparison views.
- **User Profile**: Stores user data (experience, skills, education) for faster processing and personalized suggestions.

### Technical Capabilities
- **Real-time Feedback**: Instant analysis and suggestions without page reloads.
- **Drag & Drop**: Intuitive file upload interface.
- **Responsive Design**: Fully functional on desktop and mobile devices.
- **Error Handling**: Graceful handling of file upload failures and processing errors with user-friendly messages.

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) (React Framework)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Library**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [React Icons](https://react-icons.github.io/react-icons/)

### AI & Backend
- **AI Model**: Gemini API (via @google/generative-ai)
- **Runtime**: Node.js
- **Storage**: Local file system (JSON for user data and history)

## 📂 Project Structure

```
cvpilot/
├── app/                  # Next.js application pages and layouts
│   ├── (auth)/           # Authentication pages
│   ├── api/              # API routes
│   ├── dashboard/          # Dashboard and core features
│   └── layout.tsx          # Main layout
├── components/           # Reusable React components
│   ├── auth/             # Auth components
│   ├── dashboard/          # Dashboard components
│   ├── layout/             # Layout components
│   ├── ui/               # UI primitive components
│   └── utils/            # Utility components
├── lib/                  # Application logic and utilities
│   ├── auth.ts           # Authentication helpers
│   ├── db.ts             # Database/storage helpers
│   └── gemini.ts           # AI service
├── public/               # Public assets
├── scripts/              # Automation scripts
├── styles/               # Global styles
├── .env.local            # Environment variables (not in git)
├── next.config.js        # Next.js configuration
├── package.json          # Project dependencies
└── README.md             # Project documentation
```

## 🔧 Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

### Setup

1.  **Clone the repository** (if applicable):
    ```bash
    git clone <repository-url>
    cd CVpilot
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure environment variables**:
    Create a `.env.local` file in the root directory:
    ```env
    GOOGLE_API_KEY=your_gemini_api_key_here
    ```
    *Replace `your_gemini_api_key_here` with your actual Gemini API key.*

4.  **Run the development server**:
    ```bash
    npm run dev
    ```
    The application will be accessible at `http://localhost:3000`.

## 💻 Usage

### Dashboard Overview
- **Upload CV**: Click "Upload" to select a `.docx` or `.pdf` file from your computer.
- **Job Description**: Enter the job description text in the provided field or upload a `.txt` file.
- **Optimize**: Click the "Optimize" button to start the AI analysis and content generation process.

### Key Pages
- **Dashboard**: Main hub for uploading documents and viewing recent optimizations.
- **Compare Optimized Files**: View side-by-side comparison of original and optimized CV versions with tracked changes.
- **Content Editor**: Edit and refine generated content directly in the browser.
- **Settings**: Manage your profile and application preferences.

### Authentication
- **Login**: Sign in with your credentials to access the dashboard.
- **Sign Up**: Register a new account if you're a new user.

## 🧪 Running Tests

This project uses Jest for testing. Run the test suite:

```bash
npm run test
```

## 🚀 Deployment

### Vercel Deployment

To deploy this application to Vercel:

1.  Push your code to GitHub (or your preferred Git provider).
2.  Log in to [Vercel](https://vercel.com/).
3.  Import your project and configure the environment variables (e.g., `GOOGLE_API_KEY`).
4.  Deploy!

## 📚 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Starts the development server |
| `npm run build` | Builds the production application |
| `npm run start` | Runs the production build locally |
| `npm run lint` | Runs ESLint to catch code issues |
| `npm test` | Runs Jest test suite |

## 📝 License

ISC