# Next.js + Vercel + MongoDB + Kinde Starter

A production-ready starter template with authentication, database, and deployment configured.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: MongoDB with Mongoose
- **Auth**: Kinde
- **Deployment**: Vercel
- **Package Manager**: pnpm

## Getting Started

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd nextjs-vercel-mongo-kinde
pnpm install
```

### 2. Configure Environment

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

#### MongoDB Setup

1. Create a cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Get your connection string and credentials
3. Add to `.env.local`

#### Kinde Setup

1. Create an account at [Kinde](https://kinde.com)
2. Create a new application (Next.js)
3. Copy your credentials to `.env.local`
4. In Kinde settings, add callback URLs:
   - Allowed callback URLs: `http://localhost:3000/api/auth/kinde_callback`
   - Allowed logout redirect URLs: `http://localhost:3000`

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Kinde auth handler
│   │   └── users/         # User API endpoints
│   ├── dashboard/         # Protected dashboard page
│   ├── globals.css        # Global styles + Tailwind theme
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components (add yours here)
├── lib/                   # Core library code
│   ├── auth.ts           # Authentication utilities
│   ├── mongo-utils.ts    # MongoDB/Mongoose helpers
│   └── mongoose.ts       # Database connection
├── models/               # Mongoose models
│   └── user.model.ts     # User model
├── server/               # Server-side functions
│   └── users/            # User CRUD operations
├── types/                # TypeScript types
│   ├── index.ts          # Type exports
│   ├── mongo.ts          # MongoDB base types
│   └── user.ts           # User type
└── utils/                # Utility functions
    ├── class-names.ts    # cn() for Tailwind class merging
    ├── formatting.ts     # formatMoney(), pluralize()
    ├── mongo.ts          # getRefId(), isPopulated()
    └── validation.ts     # isValidEmail(), isValidUrl()
```

## Key Features

### Authentication

The `getAuthUser()` function in `lib/auth.ts` handles:

- Cookie-based sessions (web)
- Bearer token authentication (API/mobile)
- Auto-creates users in MongoDB on first login

```typescript
import { getAuthUser } from '@/lib/auth';

const user = await getAuthUser();
if (!user) {
	// Not authenticated
}
```

### Database

MongoDB connection is cached for serverless environments. Models auto-register on import.

```typescript
import { dbConnect } from '@/lib/mongoose';
import { UserModel } from '@/models/user.model';

await dbConnect();
const users = await UserModel.find({});
```

### Utilities

```typescript
// Class name merging
import { cn } from '@/utils/class-names';
cn('px-4 py-2', isActive && 'bg-blue-500', className);

// Formatting
import { formatMoney, pluralize } from '@/utils/formatting';
formatMoney(99.99); // "$99.99"
pluralize('item', 5); // "items"

// Validation
import { isValidEmail, isValidUrl } from '@/utils/validation';
isValidEmail('test@example.com'); // true
```

## Adding New Models

1. Create type in `types/`:

```typescript
// types/post.ts
import { BaseDocument } from './mongo';

export interface Post extends BaseDocument {
	title: string;
	content: string;
	authorId: string;
}
```

2. Add to `ModelName` enum in `types/mongo.ts`:

```typescript
export enum ModelName {
	Post = 'Post',
	User = 'User',
}
```

3. Create model in `models/`:

```typescript
// models/post.model.ts
import mongoose, { Model, Schema } from 'mongoose';
import { configureSchema, UuidType } from '@/lib/mongo-utils';
import { ModelName, With_id } from '@/types';
import { Post } from '@/types/post';

const postSchema = new Schema<With_id<Post>>({
	_id: UuidType,
	title: { required: true, type: String },
	content: { type: String },
	authorId: { required: true, type: String, index: true },
});

configureSchema(postSchema);

export const PostModel: Model<With_id<Post>> =
	mongoose.models[ModelName.Post] || mongoose.model(ModelName.Post, postSchema);
```

4. Import in `lib/mongoose.ts`:

```typescript
import '@/models/post.model';
```

## Deployment

### Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

Update Kinde URLs for your production domain:

- `KINDE_SITE_URL`
- `KINDE_POST_LOGOUT_REDIRECT_URL`
- `KINDE_POST_LOGIN_REDIRECT_URL`

Add callback URLs in Kinde dashboard for production domain.

## Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix ESLint errors
pnpm format       # Format with Prettier
pnpm format:check # Check formatting
pnpm type-check   # Run TypeScript compiler
```

## License

MIT
