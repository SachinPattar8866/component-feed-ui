import { Heart } from 'lucide-react';
import { useState } from 'react';
import { likeComment, unlikeComment, createComment } from '../services/api';

export default function Comment({ comment, onLikeUpdate, postId, onCommentAdded }) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  // Comment likes are view-only in this UI: users can only like posts.
  const toggleReply = () => setShowReply(v => !v);

  const submitReply = async (e) => {
    e && e.preventDefault();
    if (!replyText.trim()) return;
    if (!postId) {
      console.error('Missing postId for reply');
      return;
    }
    setReplySubmitting(true);
    try {
      await createComment(postId, replyText, comment.id);
      setReplyText('');
      setShowReply(false);
      if (onCommentAdded) await onCommentAdded();
    } catch (err) {
      console.error('Reply failed', err);
      const detail = err.response?.data || err.response?.status || err.message;
      alert('Reply failed: ' + JSON.stringify(detail));
    } finally {
      setReplySubmitting(false);
    }
  };

  return (
    <div className={`comment ${comment.parent ? 'reply' : ''}`}>
      <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
        <div className="comment-avatar">{comment.author.substring(0,2).toUpperCase()}</div>
        <div style={{flex:1}}>
          <div className="comment-bubble">
            <div className="comment-meta"><span className="author">{comment.author}</span><span className="text-muted" style={{marginLeft:8,fontSize:12}}>{comment.created_at ? new Date(comment.created_at).toLocaleDateString() : ''}</span></div>
            <div className="comment-text">{comment.content}</div>
            <div className="comment-actions">
              <div className="comment-like-badge"><Heart size={14} /> <span className="pill-count">{comment.like_count || 0}</span></div>
              <button onClick={toggleReply} className="reply-btn">Reply</button>
            </div>

            {showReply && (
              <form onSubmit={submitReply} className="mt-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="reply-textarea"
                  rows={2}
                  placeholder="Write a reply..."
                />
                <div style={{display:'flex',justifyContent:'flex-end',marginTop:8}}>
                  <button disabled={replySubmitting} className="commit-btn" style={{padding:'8px 12px',fontSize:13}}>
                    {replySubmitting ? 'Replying...' : 'Reply'}
                  </button>
                </div>
              </form>
            )}

            {/* Recursively render nested replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="replies-list">
                {comment.replies.map((reply) => (
                  <Comment key={reply.id} comment={reply} onLikeUpdate={onLikeUpdate} postId={postId} onCommentAdded={onCommentAdded} />
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
