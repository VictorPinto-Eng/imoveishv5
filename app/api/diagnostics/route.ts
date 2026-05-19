import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: Record<string, any> = {};

  // 1. Check Node version and env variables (keys only)
  results.nodeVersion = process.version;
  results.envKeys = Object.keys(process.env).map(key => {
    const value = process.env[key] || '';
    return {
      key,
      exists: !!value,
      length: value.length,
      preview: value ? value.substring(0, 3) + '...' : ''
    };
  });

  // 2. Try importing jsonwebtoken
  try {
    const jwt = await import('jsonwebtoken');
    results.jsonwebtoken = {
      status: 'OK',
      exports: Object.keys(jwt)
    };
  } catch (err: any) {
    results.jsonwebtoken = {
      status: 'ERROR',
      message: err.message,
      stack: err.stack
    };
  }

  // 3. Try importing bcryptjs
  try {
    const bcrypt = await import('bcryptjs');
    results.bcryptjs = {
      status: 'OK',
      exports: Object.keys(bcrypt)
    };
  } catch (err: any) {
    results.bcryptjs = {
      status: 'ERROR',
      message: err.message,
      stack: err.stack
    };
  }

  // 4. Try importing lib/auth-config
  try {
    const authConfig = await import('@/lib/auth-config');
    results.authConfig = {
      status: 'OK',
      JWT_SECRET_preview: authConfig.JWT_SECRET ? authConfig.JWT_SECRET.substring(0, 3) + '...' : 'undefined'
    };
  } catch (err: any) {
    results.authConfig = {
      status: 'ERROR',
      message: err.message,
      stack: err.stack
    };
  }

  // 5. Try importing lib/db and running query
  try {
    const db = await import('@/lib/db');
    const dbResult = await db.query('SELECT 1 + 1 as test');
    results.db = {
      status: 'OK',
      testResult: dbResult.rows[0]
    };
  } catch (err: any) {
    results.db = {
      status: 'ERROR',
      message: err.message,
      stack: err.stack
    };
  }

  return NextResponse.json(results);
}
