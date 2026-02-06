import mongoose from 'mongoose';

// Import all models here to ensure they're registered
import '@/models/user.model';
import '@/models/team.model';
import '@/models/sheet.model';
import '@/models/group.model';
import '@/models/season.model';
import '@/models/team-line.model';
import '@/models/team-standing.model';

const MONGO_URI = process.env.MONGO_URI!;
const MONGO_USER = process.env.MONGO_USER;
const MONGO_PASSWORD = process.env.MONGO_PASSWORD;

if (!MONGO_URI) {
  throw new Error('Missing MONGO_URI');
}

function buildConnectionString(): string {
  if (!MONGO_USER || !MONGO_PASSWORD) {
    return MONGO_URI;
  }

  const url = new URL(MONGO_URI);
  url.username = encodeURIComponent(MONGO_USER);
  url.password = encodeURIComponent(MONGO_PASSWORD);
  return url.toString();
}

type Cached = {
  conn: null | typeof mongoose;
  promise: null | Promise<typeof mongoose>;
};

declare global {
  var mongooseCached: Cached | undefined;
}

const cached: Cached = global.mongooseCached ?? { conn: null, promise: null };
global.mongooseCached = cached;

export async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(buildConnectionString(), {
      // Serverless resilience options
      // serverSelectionTimeoutMS: 5000,
      // maxPoolSize: 10,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
