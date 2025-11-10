# Node.js Server Best Practices
## Environment Variables, Port Configuration & Security

---

## Environment Variables & Configuration

### Use Environment Variables for All Configuration

Store port numbers and other configuration in environment variables using `process.env.PORT` rather than hard-coding values. Use `.env` files to store sensitive data like API keys, database passwords, and configuration settings separately from your code.

### Implementation Pattern

```javascript
const port = process.env.PORT || 3000; // Fallback to default if not set

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

### Using the dotenv Package

For Node.js versions before 20, use the `dotenv` package to load environment variables from `.env` files:

```javascript
require('dotenv').config();

const port = process.env.PORT;
const apiKey = process.env.API_KEY;
const dbUrl = process.env.DATABASE_URL;

console.log(`Server running on port: ${port}`);
```

Starting with Node.js 20, you can load `.env` files natively without extra libraries using the `--env-file` flag:

```bash
node --env-file=.env app.js
```

### Security for .env Files

**Critical Security Practices:**

1. **Always add `.env` to your `.gitignore` file** to prevent exposing sensitive data in version control
2. **Create a `.env.example` file** with placeholder values to document required variables for teammates
3. **Validate environment variables at startup** to ensure they're properly set before the application runs

Example `.env` file:
```
PORT=3000
DATABASE_URL=mongodb://localhost:27017/myapp
API_KEY=your_api_key_here
NODE_ENV=development
```

Example `.env.example` file:
```
PORT=3000
DATABASE_URL=
API_KEY=
NODE_ENV=development
```

Example validation:
```javascript
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("Database URL not set in environment variables.");
  process.exit(1); // Exit the application if DATABASE_URL is missing
}
```

---

## Port Security & Not Exposing to the Internet

### Don't Expose Node.js Directly to the Internet

Most people don't expose their Node.js server directly to the internet but use Apache or Nginx as a frontend reverse proxy. Have your server bind to localhost only (or use firewall rules to only allow incoming ports 80 and 443).

### Bind to Localhost for Internal Access

If you see `127.0.0.1:8080` in netstat, your Node.js server is only accessible locally, not from external IPs. This is what you want for production servers behind a reverse proxy.

**Bind to localhost:**
```javascript
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Bind only to localhost - not accessible from external IPs
app.listen(port, 'localhost', () => {
  console.log(`Server running on http://localhost:${port}`);
});
```

**OR bind to 127.0.0.1:**
```javascript
app.listen(port, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${port}`);
});
```

### Use Reverse Proxy (Nginx/Apache)

**Why use a reverse proxy?**

- Standard practices say no non-root process gets to talk to the Internet on a port less than 1024
- Running Node on port 80/443 would require root privileges, which is not recommended for security
- Reverse proxy servers like Nginx handle encryption efficiently while passing requests to your Node.js server on localhost
- Apache and Nginx are designed to be very good at serving static files and can handle SSL/TLS termination

**Example Nginx configuration:**
```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**For WebSocket support (Socket.io):**
```nginx
server {
    listen 443 ssl;
    server_name duplex.example.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### Port Selection Strategy

**Development:**
- Run Node.js on any available port (3000, 8080, 8082, etc.)
- Bind to `0.0.0.0` or `localhost` as needed for local testing

**Production:**
- Run Node.js on a high port (3000, 8080, 8082) bound to `localhost` or `127.0.0.1`
- Let the reverse proxy handle public ports 80/443
- When hosting on platforms like Heroku or AWS, the platform may independently configure `process.env.PORT` for you

---

## Complete Best Practices Checklist

### Configuration Management
- [ ] Never hard-code ports, API keys, or sensitive data in your code
- [ ] Use `process.env.PORT` with a sensible fallback value
- [ ] Store all configuration in `.env` files
- [ ] Add `.env` to `.gitignore` immediately
- [ ] Create `.env.example` for documentation
- [ ] Validate environment variables at startup

### Security
- [ ] Bind to `localhost` (127.0.0.1) for production servers behind a reverse proxy
- [ ] Use Nginx/Apache as a reverse proxy for internet-facing servers
- [ ] Use firewall rules to only allow necessary ports (80, 443)
- [ ] Never expose Node.js directly to the internet in production
- [ ] Keep sensitive data out of version control

### Deployment
- [ ] Use process managers like PM2 for production deployment
- [ ] Configure environment variables in PM2 configuration file
- [ ] Set up proper logging
- [ ] Document required variables in README.md

---

## Example Complete Server Setup

### Project Structure
```
my-app/
├── .env                 # Local environment variables (DO NOT COMMIT)
├── .env.example         # Template for environment variables
├── .gitignore           # Must include .env
├── package.json
├── server.js
└── ecosystem.config.js  # PM2 configuration
```

### server.js
```javascript
require('dotenv').config();
const express = require('express');
const app = express();

// Validate required environment variables
const requiredEnvVars = ['PORT', 'DATABASE_URL', 'API_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: ${envVar} environment variable is required`);
    process.exit(1);
  }
}

const port = process.env.PORT || 3000;
const host = process.env.NODE_ENV === 'production' ? 'localhost' : '0.0.0.0';

app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.listen(port, host, () => {
  console.log(`Server running on ${host}:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
```

### .gitignore
```
node_modules/
.env
.env.local
.env.*.local
npm-debug.log
yarn-error.log
```

### ecosystem.config.js (PM2)
```javascript
module.exports = {
  apps: [{
    name: 'my-app',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

### Running in Different Environments

**Development:**
```bash
# Load from .env file
npm start

# Or set inline
PORT=3000 NODE_ENV=development node server.js
```

**Production with PM2:**
```bash
pm2 start ecosystem.config.js --env production
```

**Production with Node 20+:**
```bash
node --env-file=.env.production server.js
```

---

## Additional Resources

- [Node.js Environment Variables Guide](https://nodejs.org/en/learn/command-line/how-to-read-environment-variables-from-nodejs)
- [dotenv Package](https://www.npmjs.com/package/dotenv)
- [Nginx Reverse Proxy Setup](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/application-declaration/)
- [The Twelve-Factor App](https://12factor.net/config)

---

## Common Mistakes to Avoid

1. **Committing `.env` files to Git** - Always add to `.gitignore`
2. **Hard-coding sensitive values** - Use environment variables instead
3. **Exposing Node.js directly to the internet** - Use a reverse proxy
4. **Running as root** - Never run Node.js with root privileges
5. **Not validating environment variables** - Check at startup to fail fast
6. **Using default ports in production** - Let the environment configure ports
7. **Binding to 0.0.0.0 in production** - Bind to localhost when behind a proxy

---

**Remember:** Security is not just about what you do, but also about what you don't do. Keep your configuration external, your ports internal, and your secrets secret!
