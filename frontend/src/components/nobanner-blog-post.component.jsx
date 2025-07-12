import { Link } from "react-router-dom";
import { getDay } from "../common/date";

const MinimalBlogPost = ({ blog, index }) => {
    let {
        title,
        blog_id: id,
        author: { personal_info: { fullname, username, profile_img } },
        publishedAt
    } = blog;

    return (
        <Link to={`/blog/${id}`} className="flex gap-5 mb-4">
            <h1 className="blog-index">{index < 10 ? "0" + (index + 1) : index}</h1>
            
            <div>
                <div className="flex gap-2 items-center mb-8">
                    {/* Separate link to author profile */}
                    <Link 
                        to={`/profile/${username}`}
                        className="flex gap-1 items-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img src={profile_img} className="w-6 h-6 rounded-full" alt={fullname} />
                        <p className="line-clamp-1">{fullname}@{username}</p>
                    </Link>
                    <p className="min-w-fit">{getDay(publishedAt)}</p>
                </div>
                <h1 className="blog-title">{title}</h1>
            </div>
        </Link>
    )
}

export default MinimalBlogPost;