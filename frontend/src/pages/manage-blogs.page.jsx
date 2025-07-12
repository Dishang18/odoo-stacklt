import { useEffect, useContext, useState } from "react";
import { UserContext } from "../App";
import axios from "axios";
import { Link } from "react-router-dom";
import Loader from "../components/loader.component";

const BlogsPage = () => {
    const { userAuth = {} } = useContext(UserContext);
    const { access_token } = userAuth;

    const [blogs, setBlogs] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [deletedDocCount, setDeletedDocCount] = useState(0);
    const [isDraft, setIsDraft] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [hasMore, setHasMore] = useState(true);
    const [useMockData, setUseMockData] = useState(false);

    // Server domain from environment variables
    const SERVER_DOMAIN = import.meta.env.VITE_SERVER_DOMAIN || "http://localhost:3000";

    // Fetch blogs from the API
    const fetchBlogs = async ({ page, draft = false, query = "", deletedDocCount = 0 }) => {
        if (useMockData) {
            // Return mock data if API isn't working
            setTimeout(() => {
                const mockBlogs = generateMockBlogs(isDraft);
                setBlogs(mockBlogs);
                setLoading(false);
                setHasMore(false);
            }, 500);
            return;
        }
        
        setLoading(true);
        setError(null);
        
        try {
            // Exactly match the server endpoint and parameter structure
            const response = await axios.post(`${SERVER_DOMAIN}/user-written-blogs`, {
                page, 
                draft,
                query,
                deletedDocCount
            }, {
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/json'
                },
            });
            
            console.log("API response:", response.data);
            
            // Handle the response based on the server's structure
            const blogsData = response.data.blogs || [];
            
            if (blogsData.length === 0) {
                if (page === 1) {
                    setBlogs([]);
                }
                setHasMore(false);
            } else {
                setBlogs(prevBlogs => 
                    page === 1 ? blogsData : [...prevBlogs, ...blogsData]
                );
                setHasMore(blogsData.length === 5); // Server uses maxLimit = 5
            }
        } catch (err) {
            console.error("API error:", err);
            
            // Handle specific error scenarios
            if (err.message.includes("Network Error")) {
                setError("Network error: Cannot connect to the server. Check your connection and server status.");
                offerMockData();
            } else if (err.response?.status === 404) {
                setError("API endpoint not found (404). Double check your server configuration.");
                offerMockData();
            } else if (err.response?.status === 401) {
                setError("Authentication failed (401). Please log in again.");
            } else if (err.response?.status === 500) {
                setError(`Server error (500): ${err.response?.data?.error || "Unknown server error"}`);
                offerMockData();
            } else {
                setError(`Error: ${err.response?.data?.error || err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    // Helper function to offer mock data
    const offerMockData = () => {
        // Only show the prompt in development mode
        if (import.meta.env.DEV && !useMockData) {
            setTimeout(() => {
                if (confirm("Would you like to see example data instead? (Development mode only)")) {
                    setUseMockData(true);
                    fetchBlogs({ page: 1, draft: isDraft, query: searchQuery, deletedDocCount });
                }
            }, 100);
        }
    };

    // Generate mock data for development testing
    const generateMockBlogs = (isDraft) => {
        const count = 5;
        const mockBlogs = [];
        
        for (let i = 1; i <= count; i++) {
            mockBlogs.push({
                blog_id: `mock-${i}`,
                title: `${isDraft ? 'Draft: ' : ''}Sample Blog Post ${i}`,
                banner: `https://picsum.photos/seed/${i}/800/400`,
                des: `This is a sample description for blog post ${i}. This is mock data for development.`,
                draft: isDraft,
                activity: {
                    total_likes: Math.floor(Math.random() * 50),
                    total_comments: Math.floor(Math.random() * 10)
                }
            });
        }
        
        return mockBlogs;
    };

    useEffect(() => {
        if (access_token) {
            setPage(1);
            fetchBlogs({ 
                page: 1, 
                draft: isDraft, 
                query: searchQuery, 
                deletedDocCount 
            });
        }
    }, [access_token, isDraft, searchQuery, deletedDocCount, useMockData]);

    // For pagination
    useEffect(() => {
        if (page > 1 && access_token && !useMockData) {
            fetchBlogs({ 
                page, 
                draft: isDraft, 
                query: searchQuery, 
                deletedDocCount 
            });
        }
    }, [page]);

    const deleteBlog = (blog_id) => {
        if (!window.confirm("Are you sure you want to delete this blog?")) {
            return;
        }

        axios.post(`${SERVER_DOMAIN}/delete-blog`, {
            blog_id
        }, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        })
        .then(() => {
            const updatedBlogs = blogs.filter(blog => blog.blog_id !== blog_id);
            setBlogs(updatedBlogs);
            setDeletedDocCount(prev => prev + 1);
            alert("Blog deleted successfully");
        })
        .catch(err => {
            console.error("Error deleting blog:", err);
            alert("Failed to delete blog. Please try again.");
        });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchBlogs({ 
            page: 1, 
            draft: isDraft, 
            query: searchQuery,
            deletedDocCount 
        });
    };

    const renderEmptyState = () => {
        return (
            <div className="text-center py-12">
                <div className="mb-4">
                    <i className="fi fi-rr-document text-5xl text-gray-300"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    No {isDraft ? "Drafts" : "Published Blogs"} Found
                </h3>
                <p className="text-gray-500 mb-6">
                    {isDraft 
                        ? "You don't have any draft blogs. Start writing one now!"
                        : "You haven't published any blogs yet."}
                </p>
                <div className="flex justify-center">
                    <Link to="/editor" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                        Create New Blog
                    </Link>
                </div>
            </div>
        );
    };

    if (loading && page === 1 && !blogs.length) {
        return <Loader />;
    }

    return (
        <div className="max-w-[800px] mx-auto py-6 px-4">
            <h1 className="text-3xl font-bold mb-6">Your Blogs</h1>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                    
                    {import.meta.env.DEV && (
                        <div className="mt-3 text-sm">
                            <button 
                                onClick={() => setUseMockData(true)}
                                className="mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded"
                            >
                                Show example data instead
                            </button>
                        </div>
                    )}
                </div>
            )}

            {useMockData && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4">
                    <strong className="font-bold">Development Mode: </strong>
                    <span className="block sm:inline">
                        Showing mock data because the API is not accessible.
                    </span>
                    <button 
                        onClick={() => {
                            setUseMockData(false);
                            setError(null);
                        }}
                        className="mt-2 px-3 py-1 bg-yellow-500 text-white text-sm rounded"
                    >
                        Try API again
                    </button>
                </div>
            )}

            <div className="mb-6">
                <div className="flex flex-wrap gap-4 mb-4">
                    <button 
                        onClick={() => setIsDraft(false)}
                        className={`px-4 py-2 rounded-md ${!isDraft 
                            ? "bg-blue-500 text-white" 
                            : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"}`}
                    >
                        Published
                    </button>
                    <button
                        onClick={() => setIsDraft(true)}
                        className={`px-4 py-2 rounded-md ${isDraft 
                            ? "bg-blue-500 text-white" 
                            : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"}`}
                    >
                        Drafts
                    </button>
                </div>

                <form onSubmit={handleSearch} className="flex gap-2">
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search blogs by title..."
                        className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button 
                        type="submit"
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                        Search
                    </button>
                </form>
            </div>

            {blogs.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 gap-4">
                        {blogs.map((blog, index) => (
                            <div key={index} className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border relative">
                                <button 
                                    onClick={() => deleteBlog(blog.blog_id)}
                                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
                                    title="Delete Blog"
                                >
                                    <i className="fi fi-rr-cross-small text-xl"></i>
                                </button>

                                <div className="flex gap-4">
                                    {blog.banner && (
                                        <img 
                                            src={blog.banner} 
                                            alt={blog.title}
                                            className="w-24 h-24 rounded-md object-cover" 
                                        />
                                    )}
                                    
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h2 className="text-xl font-semibold">{blog.title}</h2>
                                            {blog.draft && (
                                                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Draft</span>
                                            )}
                                        </div>
                                        
                                        {/* Publish date paragraph removed as requested */}
                                        
                                        <p className="text-base text-gray-800 dark:text-gray-300">
                                            {blog.des || "No description available"}
                                        </p>
                                        
                                        <div className="mt-2 flex gap-2">
                                            <Link 
                                                to={`/blog/${blog.blog_id}`}
                                                className="text-sm text-blue-500 hover:underline"
                                            >
                                                {blog.draft ? "Preview" : "Read"}
                                            </Link>
                                            <Link 
                                                to={`/editor/${blog.blog_id}`}
                                                className="text-sm text-green-500 hover:underline"
                                            >
                                                Edit
                                            </Link>
                                        </div>
                                        
                                        {blog.activity && (
                                            <div className="mt-2 flex gap-3 text-sm text-gray-500">
                                                <span>{blog.activity.total_likes || 0} likes</span>
                                                <span>{blog.activity.total_comments || 0} comments</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {loading && page > 1 && (
                        <div className="text-center my-4">
                            <Loader />
                        </div>
                    )}

                    {hasMore && !useMockData && (
                        <div className="flex justify-center mt-6">
                            <button 
                                onClick={() => setPage(p => p + 1)}
                                disabled={loading}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                            >
                                {loading ? "Loading..." : "Load More"}
                            </button>
                        </div>
                    )}
                </>
            ) : (
                renderEmptyState()
            )}
        </div>
    );
};

export default BlogsPage;