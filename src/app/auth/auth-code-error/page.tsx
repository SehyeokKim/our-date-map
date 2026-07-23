import Link from "next/link";
import { AlertTriangle, Home } from "lucide-react";

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center space-y-6 border border-slate-100 dark:border-slate-700">
        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            인증 처리 실패
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            카카오 인증 코드가 만료되었거나 올바르지 않습니다.<br />
            다시 로그인해 주시기 바랍니다.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-medium transition-colors shadow-md shadow-rose-500/20"
        >
          <Home className="w-4 h-4" />
          메인 페이지로 돌아가기
        </Link>
      </div>
    </div>
  );
}
