import { useState } from 'react';
import { Heart } from 'lucide-react';
import { likePost, unlikePost, likeComment, unlikeComment } from '../services/api';

export default function LikeButton({ id, type = 'post', initialLikes = 0, isLiked = false, onLikeUpdate }) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(isLiked);
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    setLoading(true);
    try {
      if (liked) {
        // Unlike
        if (type === 'post') await unlikePost(id);
        else await unlikeComment(id);
        setLikes(likes - 1);
        setLiked(false);
      } else {
        // Like
        if (type === 'post') await likePost(id);
        else await likeComment(id);
        setLikes(likes + 1);
        setLiked(true);
      }
      if (onLikeUpdate) onLikeUpdate();
    } catch (err) {
      console.error('Failed to toggle like:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleLike}
      disabled={loading}
      className={`flex items-center gap-1.5 transition-all px-2 py-1 rounded-md text-xs font-bold ${
        liked ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:bg-gray-100'
      }`}
    >
      <Heart size={14} fill={liked ? "currentColor" : "none"} />
      <span>{likes}</span>
    </button>
  );
}
