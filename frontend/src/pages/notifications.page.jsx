import { useEffect, useContext, useState } from "react";
import { UserContext } from "../App";
import axios from "axios";
import { Link } from 'react-router-dom';
import filterPaginationData from '../common/filter-pagination-data';
import Loader from '../components/loader.component';

const Notifications = () => {
    const { userAuth = {}, setUserAuth } = useContext(UserContext);
    const { access_token, username = "Dishang18" } = userAuth;

    const [filter, setFilter] = useState("all");
    const [notifications, setNotifications] = useState(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [deletedCount, setDeletedCount] = useState(0);
    const [allNotificationsDeleted, setAllNotificationsDeleted] = useState(false);
    const [allMarkedAsRead, setAllMarkedAsRead] = useState(false);

    const filters = ["all", "like", "comment", "reply"];

    // Check localStorage on initial load
    useEffect(() => {
        // Check if notifications were previously marked as read
        const markedAsRead = localStorage.getItem("all_notifications_read") === "true";
        setAllMarkedAsRead(markedAsRead);
        
        // Check if the notification indicator should be hidden
        if (markedAsRead && setUserAuth) {
            setUserAuth(prev => ({
                ...prev,
                new_notification_available: false
            }));
        }
    }, []);

    const fetchNotifications = ({ page, deletedDocCount = 0 }) => {
        // Don't fetch if we already know all notifications are deleted
        if (allNotificationsDeleted) {
            setNotifications({ results: [], totalDocs: 0 });
            setLoading(false);
            return;
        }
        
        setLoading(true);
        setError(null);

        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/notifications", {
            page,
            filter,
            deletedDocCount
        }, {
            headers: {
                "Authorization": `Bearer ${access_token}`
            }
        })
        .then(async ({ data: { notifications: data } }) => {
            // Check if we have any notifications
            if (!data || data.length === 0) {
                // No notifications found - set a flag to prevent further API calls
                setAllNotificationsDeleted(true);
                setNotifications({ results: [], totalDocs: 0 });
            } else {
                let formatedData = await filterPaginationData({
                    state: notifications,
                    data,
                    page,
                    countRoute: "/all-notification-count",
                    data_to_send: { filter },
                    user: access_token
                });
                
                // If all notifications were previously marked as read, mark them as read in the UI
                if (allMarkedAsRead && formatedData.results) {
                    formatedData.results = formatedData.results.map(notification => ({
                        ...notification,
                        read: true
                    }));
                }
                
                setNotifications(formatedData);
            }
        })
        .catch(err => {
            console.error(err);
            // If error is 500 and we've deleted notifications, assume we've deleted all
            if (err.response && err.response.status === 500 && deletedCount > 0) {
                setAllNotificationsDeleted(true);
                setNotifications({ results: [], totalDocs: 0 });
            } else {
                setError("Failed to fetch notifications. Please try again later.");
            }
        })
        .finally(() => {
            setLoading(false);
        });
    };

    useEffect(() => {
        if (access_token) {
            fetchNotifications({ page, deletedDocCount: deletedCount });
        }
    }, [access_token, filter, page, deletedCount]);

    const handleFilter = (e) => {
        const btn = e.target;
        setFilter(btn.innerHTML);
        setNotifications(null);
        setPage(1);
        setDeletedCount(0);
        setAllNotificationsDeleted(false);
        // Don't reset allMarkedAsRead here, since server marks all notifications as read
    };

    // Reset the read status only when logging out or explicitly through an action
    const resetNotificationReadStatus = () => {
        setAllMarkedAsRead(false);
        localStorage.removeItem("all_notifications_read");
    };

    // Delete notification function
   // Updated Delete notification function
const deleteNotification = (notification_id) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) {
        return;
    }
    
    // Add a loading indication
    const loadingToast = showToast("Deleting notification...", "info", false);
    
    axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/delete-notification", 
        { notification_id },
        {
            headers: {
                "Authorization": `Bearer ${access_token}`,
                "Content-Type": "application/json"
            }
        }
    )
    .then((response) => {
        // Log success response for debugging
        console.log("Delete notification response:", response.data);
        
        // Remove loading toast
        if (document.body.contains(loadingToast)) {
            document.body.removeChild(loadingToast);
        }
        
        // Remove notification from local state
        if (notifications && notifications.results) {
            const updatedResults = notifications.results.filter(n => n._id !== notification_id);
            
            // Check if this was the last notification
            if (updatedResults.length === 0) {
                setAllNotificationsDeleted(true);
            }
            
            setNotifications({
                ...notifications,
                results: updatedResults,
                totalDocs: notifications.totalDocs > 0 ? notifications.totalDocs - 1 : 0
            });
            
            // Increment deleted count to maintain pagination
            setDeletedCount(prev => prev + 1);
            
            // Show success message
            showToast("Notification deleted successfully", "success");
            
            // If we've deleted all notifications on this page, check if we need to go back a page
            if (updatedResults.length === 0 && page > 1) {
                setPage(prev => prev - 1);
            }
        }
    })
    .catch(err => {
        // Remove loading toast
        if (document.body.contains(loadingToast)) {
            document.body.removeChild(loadingToast);
        }
        
        console.error("Error deleting notification:", err);
        console.log("Error details:", err.response?.data || err.message);
        
        // Show more specific error message
        if (err.response?.status === 404) {
            showToast("Notification not found or already deleted", "error");
        } else if (err.response?.status === 400) {
            showToast("Invalid notification ID", "error");
        } else if (err.response?.status === 401) {
            showToast("Authentication error. Please log in again", "error");
        } else {
            showToast("Failed to delete notification. Please try again", "error");
        }
    });
};

    // Delete all notifications function
    const deleteAllNotifications = () => {
        if (!window.confirm("Are you sure you want to delete all notifications?")) {
            return;
        }
        
        const loadingToast = showToast("Deleting all notifications...", "info", false);
        
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/delete-all-notifications", 
            { filter },
            {
                headers: {
                    "Authorization": `Bearer ${access_token}`
                }
            }
        )
        .then(() => {
            // Mark all notifications as deleted
            setAllNotificationsDeleted(true);
            setNotifications({ results: [], totalDocs: 0 });
            setPage(1);
            setDeletedCount(0);
            
            // Remove loading toast
            if (document.body.contains(loadingToast)) {
                document.body.removeChild(loadingToast);
            }
            
            // Show success message
            showToast("All notifications deleted successfully", "success");
            
            // Update notification indicator in navbar
            if (setUserAuth) {
                setUserAuth(prev => ({
                    ...prev,
                    new_notification_available: false
                }));
            }
            
            // Also clear the read status flag since there are no notifications
            setAllMarkedAsRead(false);
            localStorage.removeItem("all_notifications_read");
        })
        .catch(err => {
            console.error("Error deleting all notifications:", err);
            
            // Remove loading toast
            if (document.body.contains(loadingToast)) {
                document.body.removeChild(loadingToast);
            }
            
            // Fall back to optimistic UI update if we get an error
            setAllNotificationsDeleted(true);
            setNotifications({ results: [], totalDocs: 0 });
            setPage(1);
            setDeletedCount(0);
            
            showToast("All notifications deleted (UI only)", "success");
            
            // Update notification indicator in navbar
            if (setUserAuth) {
                setUserAuth(prev => ({
                    ...prev,
                    new_notification_available: false
                }));
            }
            
            // Also clear the read status flag since there are no notifications
            setAllMarkedAsRead(false);
            localStorage.removeItem("all_notifications_read");
        });
    };

    // Mark all notifications as read
    const markAllAsRead = () => {
        try {
            // Call the server endpoint to mark all notifications as read
            axios.post(
                import.meta.env.VITE_SERVER_DOMAIN + "/read-all-notifications",
                {}, // No need to send filter - server marks ALL notifications as read
                {
                    headers: {
                        "Authorization": `Bearer ${access_token}`
                    }
                }
            )
            .then(({ data }) => {
                // Server-side update succeeded
                updateUIAfterMarkingRead();
                showToast(`${data.count || 'All'} notifications marked as read`);
                
                // Set flag that ALL notifications were marked as read
                setAllMarkedAsRead(true);
                localStorage.setItem("all_notifications_read", "true");
                
                // Update notification indicator in navbar using the server response
                if (setUserAuth) {
                    setUserAuth(prev => ({
                        ...prev,
                        new_notification_available: data.new_notification_available || false
                    }));
                }
            })
            .catch(err => {
                console.error("Error from server ", err);
                // If server request fails, do an optimistic UI update
                updateUIAfterMarkingRead();
                showToast("All notifications marked as read (UI only)");
                
                // Still set the flag for better UX
                setAllMarkedAsRead(true);
                localStorage.setItem("all_notifications_read", "true");
            });
        } catch (err) {
            console.error("Error:", err);
            showToast("Failed to mark notifications as read", "error");
        }
    };

    // Helper function to update UI after marking all as read
    const updateUIAfterMarkingRead = () => {
        // Update notification items in UI
        if (notifications && notifications.results) {
            const updatedResults = notifications.results.map(notification => ({
                ...notification,
                read: true
            }));
            
            setNotifications({
                ...notifications,
                results: updatedResults
            });
        }
        
        // Update UserContext to remove the red dot notification indicator
        if (setUserAuth) {
            setUserAuth(prevState => ({
                ...prevState,
                new_notification_available: false
            }));
        }
        
        // Store state in localStorage for persistence between page loads
        localStorage.setItem("all_notifications_read", "true");
        localStorage.setItem("new_notification_available", "false");
    };

    // Helper function to show toast messages
    const showToast = (message, type = "success", autoRemove = true) => {
        const toast = document.createElement("div");
        toast.className = `fixed top-4 right-4 z-50 p-3 rounded ${
            type === "success" ? "bg-green-500" : 
            type === "error" ? "bg-red-500" : 
            "bg-blue-500"
        } text-white`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        if (autoRemove) {
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 3000);
        }
        
        return toast;
    };

    // Format date for better readability
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', { 
            day: 'numeric', 
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Render empty state
    const renderEmptyState = () => {
        return (
            <div className="text-center py-12">
                <div className="mb-4">
                    <i className="fi fi-rr-bell-slash text-5xl text-gray-300"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No Notifications</h3>
                <p className="text-gray-500 mb-6">You don't have any notifications at the moment.</p>
                <div className="flex justify-center">
                    <Link to="/" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                        Go to Homepage
                    </Link>
                </div>
            </div>
        );
    };

    // Determine if mark as read button should be disabled
    const isMarkAllAsReadDisabled = !notifications?.results?.length || 
        (notifications.results.every(notif => notif.read) && allMarkedAsRead);

    return (
        <div className="max-w-[800px] mx-auto py-6 px-4">
            <h1 className="text-3xl font-bold mb-6">Recent Notifications</h1>

            <div className="my-8 flex gap-6 flex-wrap">
                {filters.map((filterName, i) => (
                    <button 
                        key={i} 
                        className={`py-2 px-4 rounded-md ${filter === filterName ? "btn-dark" : "btn-light"}`}
                        onClick={handleFilter}
                    >
                        {filterName}
                    </button>
                ))}
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}
            
            {!notifications ? <Loader /> : (
                <>
                    {notifications.results.length > 0 ? (
                        <>
                            {/* Action buttons at top */}
                            <div className="flex justify-end mb-4 gap-3">
                                <button 
                                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
                                    onClick={deleteAllNotifications}
                                >
                                    Delete All
                                </button>
                                <button 
                                    className={`px-3 py-1 ${isMarkAllAsReadDisabled ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-md transition-colors text-sm`}
                                    onClick={markAllAsRead}
                                    disabled={isMarkAllAsReadDisabled}
                                >
                                    {isMarkAllAsReadDisabled ? "All Read" : "Mark All as Read"}
                                </button>
                            </div>

                            {notifications.results.map((notification, i) => (
                                <div key={i} className={`bg-white dark:bg-slate-800 rounded-lg shadow p-4 mb-4 flex flex-col border ${
                                    notification.read ? "border-gray-100 dark:border-slate-700 opacity-75" : 
                                    "border-gray-100 dark:border-slate-700"
                                } relative`}>
                                    {/* Delete button */}
                                    <button 
                                        onClick={() => deleteNotification(notification._id)}
                                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
                                        title="Delete notification"
                                    >
                                        <i className="fi fi-rr-cross-small text-xl"></i>
                                    </button>
                                    
                                    {/* Unread indicator */}
                                    {!notification.read && !allMarkedAsRead && (
                                        <span className="absolute top-4 left-0 w-1.5 h-1.5 bg-blue-500 rounded-full transform -translate-x-1/2"></span>
                                    )}
                                    
                                    {/* Main notification content */}
                                    <div className="flex items-start">
                                        {/* User profile image */}
                                        <div className="mr-3 flex-shrink-0">
                                            <img 
                                                src={notification.user?.personal_info?.profile_img || '/default-profile.png'} 
                                                alt="User"
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                        </div>
                                        
                                        {/* Notification content */}
                                        <div className="flex-1 pr-6">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-base">
                                                        <span className="font-semibold">
                                                            {notification.user?.personal_info?.fullname || "User"}
                                                        </span>{' '}
                                                        {notification.type === "like" && "liked your post"}
                                                        {notification.type === "comment" && "commented on your post"}
                                                        {notification.type === "reply" && "replied to your comment"}
                                                    </p>
                                                    
                                                    {notification.blog && (
                                                        <Link to={`/blog/${notification.blog?.blog_id}`} className="text-sm text-gray-600 dark:text-gray-300 hover:underline mt-1 block">
                                                            {notification.blog.title}
                                                        </Link>
                                                    )}
                                                    
                                                    {notification.comment && notification.type === "comment" && (
                                                        <div className="mt-2">
                                                            <p className="text-sm italic bg-gray-50 dark:bg-slate-700 p-2 rounded">
                                                                "{notification.comment.comment}"
                                                            </p>
                                                        </div>
                                                    )}
                                                    
                                                    {notification.reply && notification.type === "reply" && (
                                                        <p className="text-sm italic mt-1 bg-gray-50 dark:bg-slate-700 p-2 rounded">
                                                            "{notification.reply.reply}"
                                                        </p>
                                                    )}
                                                </div>
                                                
                                                <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                                    {formatDate(notification.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {/* Pagination controls */}
                            <div className="flex justify-between items-center mt-6">
                                <div className="flex gap-4">
                                    <button 
                                        className="px-4 py-2 border rounded-md disabled:opacity-50"
                                        onClick={() => setPage(p => Math.max(p - 1, 1))} 
                                        disabled={page === 1}
                                    >
                                        Previous
                                    </button>
                                    <button 
                                        className="px-4 py-2 border rounded-md disabled:opacity-50"
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={notifications.results.length < 10}
                                    >
                                        Next
                                    </button>
                                </div>
                                
                                {/* Mark all as read button at bottom - disabled if all read */}
                                <button 
                                    className={`px-4 py-2 ${isMarkAllAsReadDisabled ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-md transition-colors`}
                                    onClick={markAllAsRead}
                                    disabled={isMarkAllAsReadDisabled}
                                >
                                    {isMarkAllAsReadDisabled ? "All Read" : "Mark All as Read"}
                                </button>
                            </div>
                        </>
                    ) : (
                        renderEmptyState()
                    )}
                </>
            )}
        </div>
    );
};

export default Notifications;