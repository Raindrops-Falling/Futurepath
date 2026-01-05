import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="relative z-10 bg-black text-white py-12 mt-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-8">
          <div className="text-2xl tracking-tight font-semibold mb-4">
            <span className="text-white">Future</span>
            <span className="text-[#D4AF37]">Path</span>
          </div>
          <p className="text-sm text-gray-300 mb-6">
            Empowering careers through AI-powered learning and skill development
          </p>
        </div>
        
        <div className="flex justify-center mb-8">
          <Link 
            to="/feedback" 
            className="px-6 py-3 bg-[#D4AF37] hover:bg-[#B8941F] text-white rounded-lg transition-colors"
          >
            Give Us Feedback
          </Link>
        </div>
        
        <div className="border-t border-white/10 pt-6 text-center">
          <p className="text-xs text-gray-400">
            © 2026 FuturePath. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}