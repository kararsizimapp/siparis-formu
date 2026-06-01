/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trophy, FileSpreadsheet } from 'lucide-react';
import CustomerForm from './components/CustomerForm';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col selection:bg-indigo-500 selection:text-white">
      
      {/* CORE WORKPLACE VIEW */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CustomerForm />
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-400 font-sans">
        <div className="max-w-7xl mx-auto px-4 flex justify-center items-center">
          <a 
            href="mailto:kurumsal@crsspor.com" 
            className="text-slate-600 hover:text-indigo-600 transition-colors font-bold font-mono text-sm bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl"
          >
            📧 kurumsal@crsspor.com
          </a>
        </div>
      </footer>

    </div>
  );
}
