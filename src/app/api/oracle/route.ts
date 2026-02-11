import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execFileAsync = promisify(execFile);
const SCRIPT = path.join(process.cwd(), 'scripts', 'akshare_service.py');

export async function GET(req: NextRequest) {
  try {
    const { stdout } = await execFileAsync('python3', [SCRIPT, 'events'], { timeout: 15000 });
    const data = JSON.parse(stdout);
    if (data.error) throw new Error(data.error);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'oracle events unavailable' }, { status: 502 });
  }
}
