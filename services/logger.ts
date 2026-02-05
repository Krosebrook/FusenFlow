type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogPayload {
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  timestamp: string;
}

class Logger {
  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    const payload: LogPayload = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
    };

    // In production, this would send to Sentry, Datadog, or LogRocket
    if (process.env.NODE_ENV === 'production') {
      // Example: fetch('/api/logs', { method: 'POST', body: JSON.stringify(payload) });
    }

    const color = {
      info: 'color: #3b82f6',
      warn: 'color: #f59e0b',
      error: 'color: #ef4444',
      debug: 'color: #6b7280',
    }[level];

    console.log(`%c[${payload.timestamp}] [${level.toUpperCase()}] ${message}`, color, context || '');
  }

  info(msg: string, ctx?: Record<string, any>) { this.log('info', msg, ctx); }
  warn(msg: string, ctx?: Record<string, any>) { this.log('warn', msg, ctx); }
  error(msg: string, ctx?: Record<string, any>) { this.log('error', msg, ctx); }
  debug(msg: string, ctx?: Record<string, any>) { this.log('debug', msg, ctx); }
}

export const logger = new Logger();