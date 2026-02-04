import { useState } from 'react';
import { Heart, MessageSquare, Send } from 'lucide-react';
import Comment from './Comment';
import LikeButton from './LikeButton';
import { createComment } from '../services/api';

export default function Post({ post, onUpdate }) {
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleCommentForm = () => setShowCommentForm(v => !v);

  const handleSubmitComment = async (e) => {
    e && e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      await createComment(post.id, commentText, null);
      setCommentText('');
      setShowCommentForm(false);
      if (onUpdate) await onUpdate();
    } catch (err) {
      console.error('Comment failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border rounded-xl p-6 hover:shadow-sm transition-all bg-white group">
      <div className="flex justify-between items-start mb-4">
        <span className="font-bold text-gray-900 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[10px] text-blue-600 border">
            {post.author.substring(0,2).toUpperCase()}
          </div>
          {post.author}
        </span>
        <span className="text-[9px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded uppercase border">
          General
        </span>
      </div>
      
      <p className="text-gray-700 text-sm leading-relaxed mb-6">
        {post.content}
      </p>
      
      <div className="flex gap-6 text-xs font-bold text-gray-400 border-t pt-4 mb-4">
        <LikeButton 
          id={post.id} 
          type="post" 
          initialLikes={post.like_count || 0}
          isLiked={post.is_liked || false}
          onLikeUpdate={onUpdate}
        />
        <button onClick={toggleCommentForm} className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
          <MessageSquare size={14} /> {post.comment_count || 0}
        </button>
      </div>

      {/* Comment form */}
      {showCommentForm && (
        <form onSubmit={handleSubmitComment} className="mb-4">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg resize-none text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            rows={3}
            placeholder="Write a reply..."
          />
          <div className="flex justify-end mt-2">
            <button disabled={submitting} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
              <Send className="w-4 h-4" /> {submitting ? 'Posting...' : 'Reply'}
            </button>
          </div>
        </form>
      )}

      {/* Display comments */}
      {post.comments && post.comments.length > 0 && (
        <div className="space-y-2 mt-4">
          {post.comments.map((comment) => (
            <Comment key={comment.id} comment={comment} onLikeUpdate={onUpdate} postId={post.id} onCommentAdded={onUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
