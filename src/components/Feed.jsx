import { useState, useEffect } from 'react';
import { getPosts } from '../services/api';
import Post from './Post';

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const response = await getPosts();
      setPosts(response.data.results || response.data);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-400">
        <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mb-4"></div>
        <p className="text-xs font-bold uppercase tracking-widest">Fetching Data from Server...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.length > 0 ? (
        posts.map((post) => (
          <Post key={post.id} post={post} onUpdate={fetchPosts} />
        ))
      ) : (
        <p className="text-center text-gray-400 py-10">No posts yet</p>
      )}
    </div>
  );
}
