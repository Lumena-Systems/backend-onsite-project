import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';
import { CRMType, ResourceType } from '@mock-crm/shared';

export interface RequestLogger {
  db: Database.Database;
  emitLog?: (log: any) => void;
}

export function createRequestLogger(config: RequestLogger) {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Capture original end
    const originalEnd = res.end;
    let responseBody: any;

    // Override res.json to capture response
    const originalJson = res.json;
    res.json = function(body: any) {
      responseBody = body;
      return originalJson.call(this, body);
    };

    // Override res.end to log after response
    res.end = function(...args: any[]) {
      const responseTime = Date.now() - startTime;
      
      // Parse request details
      const pathParts = req.path.split('/').filter(Boolean);
      let crm: CRMType | undefined;
      let resourceType: ResourceType | undefined;

      if (pathParts[0] === 'api' && pathParts[1]) {
        crm = pathParts[1] as CRMType;
        if (pathParts[2]) {
          resourceType = pathParts[2] as ResourceType;
        }
      }

      // Create log entry
      const logId = uuidv4();
      const logEntry = {
        id: logId,
        crm: crm || 'unknown',
        method: req.method,
        endpoint: req.path,
        resource_type: resourceType,
        status_code: res.statusCode,
        response_time_ms: responseTime,
        request_headers: JSON.stringify(req.headers),
        request_body: req.body ? JSON.stringify(req.body) : null,
        request_query: req.query && Object.keys(req.query).length > 0 ? JSON.stringify(req.query) : null,
        response_body: responseBody ? JSON.stringify(responseBody) : null,
        error_message: res.statusCode >= 400 ? responseBody?.error || responseBody?.message : null,
        timestamp: new Date().toISOString(),
      };

      // Store in database (only for CRM API requests)
      if (crm && crm !== 'unknown' && pathParts[0] === 'api') {
        try {
          const stmt = config.db.prepare(`
            INSERT INTO api_logs 
            (id, crm, method, endpoint, resource_type, status_code, response_time_ms,
             request_headers, request_body, request_query, response_body, error_message, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          stmt.run(
            logEntry.id,
            logEntry.crm,
            logEntry.method,
            logEntry.endpoint,
            logEntry.resource_type,
            logEntry.status_code,
            logEntry.response_time_ms,
            logEntry.request_headers,
            logEntry.request_body,
            logEntry.request_query,
            logEntry.response_body,
            logEntry.error_message,
            logEntry.timestamp
          );

          // Emit to WebSocket if available
          if (config.emitLog) {
            config.emitLog(logEntry);
          }
        } catch (error) {
          console.error('Failed to log request:', error);
        }
      }

      return originalEnd.apply(res, args);
    };

    next();
  };
}

