import React, { useState } from 'react';
import MainMenu from './components/MainMenu';
import GameCanvas from './components/GameCanvas';
import { Avatar, GameState } from './types';
import { Trophy, RefreshCcw } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [playerAvatar, setPlayerAvatar] = useState<Avatar>(Avatar.BIRDY);
  const [winner, setWinner] = useState<'PLAYER' | 'CPU' | null>(null);

  const handleStart = (avatar: Avatar) => {
    setPlayerAvatar(avatar);
    setGameState(GameState.PLAYING);
  };

  const handleGameOver = (win: 'PLAYER' | 'CPU') => {
    setWinner(win);
    setGameState(GameState.GAME_OVER);
  };

  const handleRestart = () => {
    setGameState(GameState.MENU);
    setWinner(null);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {gameState === GameState.MENU && (
        <MainMenu onStart={handleStart} />
      )}

      {gameState === GameState.PLAYING && (
        <GameCanvas playerAvatar={playerAvatar} onGameOver={handleGameOver} />
      )}

      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-50 animate-in fade-in duration-500">
          <div className="bg-gray-900 p-12 rounded-3xl border-4 border-yellow-500 text-center shadow-2xl transform scale-100">
            {winner === 'PLAYER' ? (
              <>
                <Trophy size={80} className="mx-auto text-yellow-400 mb-6 animate-bounce" />
                <h1 className="text-6xl pixel-font text-yellow-400 mb-4">VICTORY!</h1>
                <p className="text-xl text-gray-300 mb-8">You successfully Zabayan'd him!</p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-6">💀</div>
                <h1 className="text-6xl pixel-font text-red-500 mb-4">DEFEAT</h1>
                <p className="text-xl text-gray-300 mb-8">The AI played the Bayan better than you.</p>
              </>
            )}
            
            <button
              onClick={handleRestart}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xl flex items-center justify-center mx-auto transition-colors"
            >
              <RefreshCcw className="mr-2" /> Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
