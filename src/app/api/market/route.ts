import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';

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

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const action = searchParams.get('action') || 'overview';

  const args: string[] = [];
  if (action === 'quotes' && searchParams.get('codes')) {
    args.push(searchParams.get('codes')!);
  }
  if (action === 'kline' && searchParams.get('code')) {
    args.push(searchParams.get('code')!);
  }

  // 有效 action: overview, quotes, kline, sectors, events
  const validActions = ['overview', 'quotes', 'kline', 'sectors', 'events', 'scanner', 'swsectors'];
  if (!validActions.includes(action)) {
    return NextResponse.json({ error: `unknown action: ${action}` }, { status: 400 });
  }

  const data = await fetchPython(action, args);
  if (data !== null) {
    return NextResponse.json(data);
  }

  return NextResponse.json(
    { error: `data source unavailable for action: ${action}` },
    { status: 502 },
  );
}
