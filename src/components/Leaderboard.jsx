import { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { getLeaderboard } from '../services/api';

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await getLeaderboard();
        setUsers(response.data);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
    // Refresh every 30 seconds
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Trophy size={16} className="text-yellow-500" /> Leaderboard
          </h3>
        </div>
        <div className="p-6 text-center text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
      <div className="bg-gray-50 px-6 py-4 border-b flex items-center justify-between">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Trophy size={16} className="text-yellow-500" /> Leaderboard
        </h3>
        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">24H</span>
      </div>
      <div className="divide-y">
        {users.map((user, index) => (
          <div key={user.id || user.username} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold w-4 ${index < 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                {index + 1}.
              </span>
              <span className="text-sm font-medium text-gray-700">{user.username}</span>
            </div>
            <span className="text-xs font-black text-gray-900 tabular-nums">
              {user.karma_24h} <span className="text-[9px] text-gray-400 uppercase tracking-tighter font-bold">Karma</span>
            </span>
          </div>
        ))}
      </div>
      <div className="p-4 bg-gray-50/50 border-t">
        <p className="text-[9px] text-gray-400 leading-tight text-center uppercase font-bold tracking-tight">
          Weighted Calculation (Likes + Engagement)
        </p>
      </div>
    </div>
  );
}
