# Token Service

Web3 Token Information API with dynamic rate-limiting. 🪙

# Setup

1. [Install Redis.](https://redis.io/docs/latest/operate/oss_and_stack/install/install-redis/)

2. Install dependencies.

```bash
npm install
```

# Start Server

1. Development server

```bash
npm run start:dev
```

2. Production build

```bash
npm run start
```

# Run Tests

1. Unit Tests

```bash
npm run test
```

1. Integration Tests

```bash
npm run test:e2e
```

# Assumptions

- The default rate-limiting is done per minute. For extensibility, an interval field is added which can be used to configure the rate-limit as per the interval. This would require some implementation, but should be fairly easy to add to `core/rate-limiter.service.ts`.
