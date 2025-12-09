import React from 'react';
import { Avatar } from '../types';
import { AVATAR_COLORS, AVATAR_NAMES } from '../constants';
import { Bird, User, Trophy, Zap } from 'lucide-react';

interface MainMenuProps {
  onStart: (avatar: Avatar) => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStart }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white z-50">
      <div className="text-center mb-12">
        <h1 className="text-6xl md:text-8xl pixel-font text-yellow-400 mb-4 drop-shadow-lg tracking-tighter">
          ЗАБАЯНЬ ЕГО!
        </h1>
        <p className="text-xl text-gray-400">Battle of the Bayans</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-4xl px-8">
        {/* Birdy Selection */}
        <button
          onClick={() => onStart(Avatar.BIRDY)}
          className="group relative p-8 bg-gray-800 rounded-2xl border-4 border-transparent hover:border-yellow-400 transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center"
        >
          <div className="w-32 h-32 rounded-full bg-yellow-400 flex items-center justify-center mb-6 shadow-xl group-hover:shadow-yellow-400/50 transition-shadow">
            <Bird size={64} className="text-black" />
          </div>
          <h2 className="text-3xl font-bold mb-2 pixel-font">{AVATAR_NAMES[Avatar.BIRDY]}</h2>
          <div className="flex space-x-2 text-sm text-yellow-300">
             <span className="flex items-center"><Zap size={16} className="mr-1"/> Agile</span>
          </div>
        </button>

        {/* Blackman Selection */}
        <button
          onClick={() => onStart(Avatar.BLACKMAN)}
          className="group relative p-8 bg-gray-800 rounded-2xl border-4 border-transparent hover:border-gray-500 transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center"
        >
          <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center mb-6 shadow-xl group-hover:shadow-gray-500/50 transition-shadow">
            <User size={64} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-2 pixel-font">{AVATAR_NAMES[Avatar.BLACKMAN]}</h2>
          <div className="flex space-x-2 text-gray-300">
             <span className="flex items-center"><Trophy size={16} className="mr-1"/> Strong</span>
          </div>
        </button>
      </div>

      <div className="mt-16 text-gray-500 text-sm">
        Use <span className="font-bold text-white px-2 py-1 bg-gray-700 rounded">Mouse</span> to move. Click to serve.
      </div>
    </div>
  );
};

export default MainMenu;
