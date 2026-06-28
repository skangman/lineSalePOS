import type { Request, Response, NextFunction } from 'express'

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(err)
  const status = err.status || err.statusCode || 500
  const message = err.message || 'Internal Server Error'
  res.status(status).json({ error: message })
}

export function notFound(req: Request, res: Response) {
  res.status(404).json({ error: `Route ${req.path} not found` })
}
