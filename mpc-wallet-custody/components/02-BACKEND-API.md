# Component 2: Backend API (Node.js/TypeScript)

## Overview
Minimal REST API handling OAuth orchestration, organization/app management, and wallet address registry. Does NOT handle private keys or transaction submission.

## Timeline
**Duration**: 4 weeks (Weeks 1-4)

**Dependencies**: PostgreSQL database

## Tech Stack

```json
{
  "runtime": "Node.js 20+",
  "framework": "Express.js",
  "language": "TypeScript 5+",
  "database": "PostgreSQL 15+",
  "orm": "Prisma",
  "auth": "passport.js",
  "validation": "zod",
  "testing": "jest + supertest"
}
```

## Project Structure

```
api/
├── src/
│   ├── index.ts                      # Entry point
│   ├── app.ts                        # Express app
│   ├── config/
│   │   ├── database.ts
│   │   ├── oauth.ts
│   │   └── env.ts
│   ├── routes/
│   │   ├── v2/
│   │   │   ├── org.routes.ts
│   │   │   ├── apps.routes.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── wallet.routes.ts
│   │   └── health.routes.ts
│   ├── controllers/
│   │   ├── org.controller.ts
│   │   ├── apps.controller.ts
│   │   ├── auth.controller.ts
│   │   └── wallet.controller.ts
│   ├── services/
│   │   ├── org.service.ts
│   │   ├── apps.service.ts
│   │   ├── oauth/
│   │   │   ├── google.service.ts
│   │   │   └── apple.service.ts
│   │   └── wallet.service.ts
│   ├── repositories/
│   │   ├── org.repository.ts
│   │   ├── apps.repository.ts
│   │   └── wallet.repository.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── ratelimit.middleware.ts
│   ├── types/
│   │   ├── express.d.ts
│   │   ├── auth.types.ts
│   │   └── api.types.ts
│   └── utils/
│       ├── logger.ts
│       ├── errors.ts
│       └── crypto.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── package.json
├── tsconfig.json
└── .env.example
```

## Database Schema (Prisma)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Organization {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  password  String   // bcrypt hashed
  apiKey    String   @unique @default(uuid())
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  apps App[]

  @@map("organizations")
}

model App {
  id           String   @id @default(uuid())
  appId        String   @unique @map("app_id")
  orgId        String   @map("org_id")
  name         String
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  organization Organization    @relation(fields: [orgId], references: [id], onDelete: Cascade)
  wallets      WalletAddress[]

  @@index([orgId])
  @@index([appId])
  @@map("apps")
}

model WalletAddress {
  id        String   @id @default(uuid())
  appId     String   @map("app_id")
  provider  String   // 'google' | 'apple'
  userId    String   @map("user_id")
  userEmail String   @map("user_email")
  address   String   @unique
  publicKey String   @map("public_key")
  network   String   @default("starknet-mainnet")
  createdAt DateTime @default(now()) @map("created_at")

  app App @relation(fields: [appId], references: [id], onDelete: Cascade)

  @@unique([appId, provider, userId])
  @@index([appId])
  @@index([userEmail])
  @@index([provider])
  @@map("wallet_addresses")
}
```

## API Endpoints

### 1. Organization Management

#### POST /v2/org/register
```typescript
// controllers/org.controller.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { OrgService } from '../services/org.service';

const RegisterSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  password: z.string().min(8)
});

export class OrgController {
  constructor(private orgService: OrgService) {}

  async register(req: Request, res: Response) {
    const body = RegisterSchema.parse(req.body);

    const org = await this.orgService.createOrganization({
      name: body.name,
      email: body.email,
      password: body.password
    });

    res.status(201).json({
      id: org.id,
      name: org.name,
      email: org.email,
      apiKey: org.apiKey
    });
  }

  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    const org = await this.orgService.authenticate(email, password);

    if (!org) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      id: org.id,
      apiKey: org.apiKey
    });
  }

  async getOrganization(req: Request, res: Response) {
    const { orgId } = req.params;

    const org = await this.orgService.getById(orgId);

    res.json({
      id: org.id,
      name: org.name,
      email: org.email,
      createdAt: org.createdAt
    });
  }
}
```

#### Service Implementation
```typescript
// services/org.service.ts
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

export class OrgService {
  constructor(private prisma: PrismaClient) {}

  async createOrganization(data: {
    name: string;
    email: string;
    password: string;
  }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.organization.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword
      }
    });
  }

  async authenticate(email: string, password: string) {
    const org = await this.prisma.organization.findUnique({
      where: { email }
    });

    if (!org) return null;

    const valid = await bcrypt.compare(password, org.password);
    return valid ? org : null;
  }

  async getById(id: string) {
    return this.prisma.organization.findUniqueOrThrow({
      where: { id }
    });
  }
}
```

### 2. App Management

#### POST /v2/org/:orgId/apps
```typescript
// controllers/apps.controller.ts
import { nanoid } from 'nanoid';

export class AppsController {
  constructor(private appsService: AppsService) {}

  async createApp(req: Request, res: Response) {
    const { orgId } = req.params;
    const { name } = req.body;

    // Verify org ownership via API key
    if (req.org.id !== orgId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const app = await this.appsService.create({
      orgId,
      name,
      appId: nanoid(16) // Generate unique app_id
    });

    res.status(201).json({
      id: app.id,
      appId: app.appId,
      name: app.name,
      createdAt: app.createdAt
    });
  }

  async listApps(req: Request, res: Response) {
    const { orgId } = req.params;

    const apps = await this.appsService.listByOrg(orgId);

    res.json({ apps });
  }

  async deleteApp(req: Request, res: Response) {
    const { orgId, appId } = req.params;

    await this.appsService.delete(appId, orgId);

    res.status(204).send();
  }
}
```

### 3. Authentication (OAuth)

#### POST /v2/auth/google
```typescript
// controllers/auth.controller.ts
import { GoogleOAuthService } from '../services/oauth/google.service';

export class AuthController {
  constructor(
    private googleService: GoogleOAuthService,
    private appleService: AppleOAuthService
  ) {}

  async googleAuth(req: Request, res: Response) {
    const { code, appId } = req.body;

    try {
      // 1. Exchange code for tokens
      const tokens = await this.googleService.exchangeCodeForTokens(code);

      // 2. Get user info
      const userInfo = await this.googleService.getUserInfo(
        tokens.access_token
      );

      // 3. Return access token to client
      res.json({
        accessToken: tokens.access_token,
        email: userInfo.email,
        userId: userInfo.sub
      });
    } catch (error) {
      res.status(400).json({ error: 'OAuth failed' });
    }
  }

  async appleAuth(req: Request, res: Response) {
    const { code, identityToken, appId } = req.body;

    try {
      // 1. Verify Apple identity token
      const decoded = await this.appleService.verifyIdentityToken(
        identityToken
      );

      // 2. Return user info
      res.json({
        email: decoded.email,
        userId: decoded.sub
      });
    } catch (error) {
      res.status(400).json({ error: 'Apple auth failed' });
    }
  }
}
```

#### Google OAuth Service
```typescript
// services/oauth/google.service.ts
import { OAuth2Client } from 'google-auth-library';

export class GoogleOAuthService {
  private client: OAuth2Client;

  constructor() {
    this.client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  async exchangeCodeForTokens(code: string) {
    const { tokens } = await this.client.getToken(code);
    return tokens;
  }

  async getUserInfo(accessToken: string) {
    const response = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    return response.json();
  }
}
```

#### Apple OAuth Service
```typescript
// services/oauth/apple.service.ts
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

export class AppleOAuthService {
  private client: jwksClient.JwksClient;

  constructor() {
    this.client = jwksClient({
      jwksUri: 'https://appleid.apple.com/auth/keys'
    });
  }

  async verifyIdentityToken(identityToken: string) {
    const decoded = jwt.decode(identityToken, { complete: true });

    if (!decoded) {
      throw new Error('Invalid token');
    }

    const key = await this.client.getSigningKey(decoded.header.kid);
    const signingKey = key.getPublicKey();

    const verified = jwt.verify(identityToken, signingKey, {
      audience: process.env.APPLE_CLIENT_ID,
      issuer: 'https://appleid.apple.com'
    });

    return verified as { sub: string; email: string };
  }
}
```

### 4. Wallet Management

#### POST /v2/wallet/register
```typescript
// controllers/wallet.controller.ts
export class WalletController {
  constructor(private walletService: WalletService) {}

  async register(req: Request, res: Response) {
    const {
      appId,
      provider,
      userId,
      email,
      address,
      publicKey
    } = req.body;

    // Validate app exists
    const app = await this.walletService.validateApp(appId);

    // Register wallet
    const wallet = await this.walletService.register({
      appId: app.id,
      provider,
      userId,
      userEmail: email,
      address,
      publicKey
    });

    res.status(201).json({ success: true });
  }

  async getWallet(req: Request, res: Response) {
    const { address } = req.params;

    const wallet = await this.walletService.getByAddress(address);

    res.json({
      address: wallet.address,
      publicKey: wallet.publicKey,
      network: wallet.network,
      appId: wallet.app.appId,
      createdAt: wallet.createdAt
    });
  }
}
```

## Middleware

### Authentication Middleware
```typescript
// middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';

export const authenticateOrg = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  const org = await prisma.organization.findUnique({
    where: { apiKey }
  });

  if (!org) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  req.org = org;
  next();
};
```

### Rate Limiting
```typescript
// middleware/ratelimit.middleware.ts
import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: 'Too many auth attempts'
});

export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100
});
```

### Validation Middleware
```typescript
// middleware/validation.middleware.ts
import { z } from 'zod';

export const validate = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      }
      next(error);
    }
  };
};
```

### Error Handler
```typescript
// middleware/error.middleware.ts
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(err);

  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Resource already exists' });
    }
  }

  res.status(500).json({ error: 'Internal server error' });
};
```

## App Setup

```typescript
// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { orgRouter } from './routes/v2/org.routes';
import { appsRouter } from './routes/v2/apps.routes';
import { authRouter } from './routes/v2/auth.routes';
import { walletRouter } from './routes/v2/wallet.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/v2/org', orgRouter);
app.use('/v2/org/:orgId/apps', appsRouter);
app.use('/v2/auth', authRouter);
app.use('/v2/wallet', walletRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling
app.use(errorHandler);

export default app;
```

## Environment Variables

```bash
# .env.example
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/cavos

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Apple OAuth
APPLE_CLIENT_ID=your_client_id
APPLE_TEAM_ID=your_team_id
APPLE_KEY_ID=your_key_id
APPLE_PRIVATE_KEY=your_private_key

# Security
JWT_SECRET=your_jwt_secret
BCRYPT_ROUNDS=10
```

## Testing

### Unit Tests
```typescript
// tests/unit/org.service.test.ts
import { OrgService } from '../../src/services/org.service';
import { prismaMock } from '../mocks/prisma';

describe('OrgService', () => {
  let service: OrgService;

  beforeEach(() => {
    service = new OrgService(prismaMock);
  });

  it('should create organization', async () => {
    prismaMock.organization.create.mockResolvedValue({
      id: '123',
      name: 'Test Org',
      email: 'test@example.com',
      password: 'hashed',
      apiKey: 'key123',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const org = await service.createOrganization({
      name: 'Test Org',
      email: 'test@example.com',
      password: 'password123'
    });

    expect(org.name).toBe('Test Org');
  });
});
```

### Integration Tests
```typescript
// tests/integration/auth.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('POST /v2/auth/google', () => {
  it('should return access token', async () => {
    const response = await request(app)
      .post('/v2/auth/google')
      .send({
        code: 'valid_code',
        appId: 'app_123'
      })
      .expect(200);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('email');
    expect(response.body).toHaveProperty('userId');
  });
});
```

## Deployment

### Docker
```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/cavos
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=cavos
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Deliverables

- [ ] Express API with TypeScript
- [ ] Prisma schema + migrations
- [ ] OAuth integrations (Google + Apple)
- [ ] Organization/App CRUD
- [ ] Wallet registry
- [ ] Authentication middleware
- [ ] Rate limiting
- [ ] Error handling
- [ ] Unit tests (>80% coverage)
- [ ] Integration tests
- [ ] API documentation (OpenAPI)
- [ ] Docker setup
- [ ] CI/CD pipeline

## Success Metrics

- **Response Time**: < 100ms (p95)
- **Uptime**: 99.9%
- **Test Coverage**: > 80%
- **API Documentation**: Complete OpenAPI spec
