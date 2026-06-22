import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';
import { JWT_SECRET } from '@/lib/auth-config';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    const userId = decoded.id;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    // SEC-02: Validação de tipo e tamanho de arquivo
    const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
    const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB para documentos

    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ error: `Tipo de arquivo não permitido: .${ext}. Use: ${ALLOWED_EXTENSIONS.join(', ')}` }, { status: 400 });
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `MIME type não permitido: ${file.type}` }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `Arquivo excede o limite de 10MB (${(file.size / 1024 / 1024).toFixed(1)}MB)` }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `creci_${crypto.randomUUID()}.${ext}`;

    const isDocker = process.platform === 'linux';
    const baseDir = isDocker ? '/app/public/uploads/documents' : join(process.cwd(), 'public', 'uploads', 'documents');
    const uploadDir = join(baseDir, userId.toString());

    // Create directories
    await mkdir(uploadDir, { recursive: true });

    // Write file
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/documents/${userId}/${filename}`;

    // Update users table: save document url and set creci_status to false (pending)
    await query(
      'UPDATE users SET creci_document_url = $1, creci_status = false WHERE id = $2',
      [fileUrl, userId]
    );

    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error: any) {
    console.error('Error uploading CRECI document:', error);
    return NextResponse.json({ error: 'Erro ao fazer upload do documento' }, { status: 500 });
  }
}
