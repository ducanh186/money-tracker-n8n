import React from 'react';
import { Bell, Search, Settings, User } from 'lucide-react';

export function TopNav() {
  return (
    <nav className="bg-[#1e293b] border-b border-slate-700 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2 text-blue-500 font-bold text-xl">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white">
            6H
          </div>
          <span>6 Hũ</span>
        </div>
        
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <a href="#" className="text-white border-b-2 border-blue-500 py-1">Tổng quan</a>
          <a href="#" className="hover:text-white transition-colors py-1">Ngân sách</a>
          <a href="#" className="hover:text-white transition-colors py-1">Giao dịch</a>
          <a href="#" className="hover:text-white transition-colors py-1">Hũ</a>
          <a href="#" className="hover:text-white transition-colors py-1">Báo cáo</a>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm..." 
            className="bg-[#0f172a] border border-slate-700 rounded-full pl-10 pr-4 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors w-64"
          />
        </div>
        
        <button className="p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-slate-800">
          <Bell className="w-5 h-5" />
        </button>
        <button className="p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-slate-800">
          <Settings className="w-5 h-5" />
        </button>
        
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium cursor-pointer overflow-hidden border border-slate-600">
           <img src="https://picsum.photos/seed/avatar/100/100" alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
      </div>
    </nav>
  );
}
