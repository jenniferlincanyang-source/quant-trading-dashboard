import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';

export const dynamic = 'force-static';

const execFileAsync = promisify(execFile);
const SCRIPT = path.join(process.cwd(), 'scripts', 'akshare_service.py');

/**
 * 调用 Python 数据服务 (腾讯财经 + 新浪财经双源)
 * 脚本内部已做降级: 腾讯 → 新浪 → 报错
 */
async function fetchPython(cmd: string, args: string[] = []) {
  try {
    const { stdout } = await execFileAsync('python3', [SCRIPT, cmd, ...args], {
      timeout: 15000,
    });
    const data = JSON.parse(stdout);
    if (data && typeof data === 'object' && 'error' in data) {
      throw new Error(data.error);
    }
    return data;
  } catch {
    return null;
  }
}

export async function GET() {
  // Static export: return overview data as default
  const data = await fetchPython('overview');
  if (data !== null) {
    return NextResponse.json(data);
  }

  return NextResponse.json(
    { error: 'data source unavailable' },
    { status: 502 },
  );
}
