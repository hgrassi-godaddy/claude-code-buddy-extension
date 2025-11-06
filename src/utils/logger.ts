// Logging utility for the extension

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

export interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: Date;
    context?: any;
    source?: string;
}

export class Logger {
    private static instance: Logger;
    private logLevel: LogLevel = LogLevel.INFO;
    private logs: LogEntry[] = [];
    private readonly maxLogs = 1000;

    private constructor() {}

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    public setLogLevel(level: LogLevel): void {
        this.logLevel = level;
    }

    public debug(message: string, context?: any, source?: string): void {
        this.log(LogLevel.DEBUG, message, context, source);
    }

    public info(message: string, context?: any, source?: string): void {
        this.log(LogLevel.INFO, message, context, source);
    }

    public warn(message: string, context?: any, source?: string): void {
        this.log(LogLevel.WARN, message, context, source);
    }

    public error(message: string, context?: any, source?: string): void {
        this.log(LogLevel.ERROR, message, context, source);
    }

    private log(level: LogLevel, message: string, context?: any, source?: string): void {
        if (level < this.logLevel) {
            return;
        }

        const entry: LogEntry = {
            level,
            message,
            timestamp: new Date(),
            context,
            source
        };

        this.logs.push(entry);

        // Trim logs if we exceed the maximum
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }

        // Output to console
        const prefix = `[Claude Buddy${source ? `:${source}` : ''}]`;
        const timestamp = entry.timestamp.toISOString();

        switch (level) {
            case LogLevel.DEBUG:
                console.debug(`${prefix}[DEBUG] ${timestamp}: ${message}`, context);
                break;
            case LogLevel.INFO:
                console.info(`${prefix}[INFO] ${timestamp}: ${message}`, context);
                break;
            case LogLevel.WARN:
                console.warn(`${prefix}[WARN] ${timestamp}: ${message}`, context);
                break;
            case LogLevel.ERROR:
                console.error(`${prefix}[ERROR] ${timestamp}: ${message}`, context);
                break;
        }
    }

    public getLogs(level?: LogLevel): LogEntry[] {
        if (level !== undefined) {
            return this.logs.filter(entry => entry.level >= level);
        }
        return [...this.logs];
    }

    public clearLogs(): void {
        this.logs = [];
    }

    public getLogsSummary(): { [key in LogLevel]: number } {
        const summary = {
            [LogLevel.DEBUG]: 0,
            [LogLevel.INFO]: 0,
            [LogLevel.WARN]: 0,
            [LogLevel.ERROR]: 0
        };

        this.logs.forEach(entry => {
            summary[entry.level]++;
        });

        return summary;
    }
}

// Create and export default logger instance
export const logger = Logger.getInstance();

// Convenience functions for common logging scenarios
export function logExtensionActivation(): void {
    logger.info('Extension activated successfully', undefined, 'Extension');
}

export function logExtensionDeactivation(): void {
    logger.info('Extension deactivated', undefined, 'Extension');
}

export function logWebviewCreation(): void {
    logger.info('Webview created and initialized', undefined, 'Webview');
}

export function logChatMessage(message: string, type: 'user' | 'buddy'): void {
    logger.debug(`Chat message [${type}]: ${message}`, { type, message }, 'Chat');
}

export function logCustomizationChange(property: string, value: string): void {
    logger.debug(`Customization changed: ${property} = ${value}`, { property, value }, 'Customization');
}

export function logPromptHistoryUpdate(count: number): void {
    logger.debug(`Prompt history updated with ${count} entries`, { count }, 'PromptHistory');
}

export function logError(error: Error, context?: string): void {
    logger.error(`${context ? `${context}: ` : ''}${error.message}`, {
        error: error.message,
        stack: error.stack,
        context
    }, context || 'Error');
}

export function logFileOperation(operation: string, filePath: string, success: boolean): void {
    const message = `File ${operation}: ${filePath} - ${success ? 'SUCCESS' : 'FAILED'}`;
    if (success) {
        logger.debug(message, { operation, filePath, success }, 'FileSystem');
    } else {
        logger.warn(message, { operation, filePath, success }, 'FileSystem');
    }
}