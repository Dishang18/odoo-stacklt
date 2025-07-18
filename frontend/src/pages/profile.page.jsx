// import { useContext, useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import AnimationWrapper from "../common/page-animation";
// import { UserContext } from "../App";
// import AboutUser from "../components/about.component";
// import Loader from "../components/loader.component";
// import axios from "axios";
// import { Link } from "react-router-dom";
// import { filterPaginationData } from "../common/filter-pagination-data";
// import InPageNavigation from "../components/inpage-navigation.component";
// import BlogPostCard from "../components/blog-post.component";
// import NoDataMessage from "../components/nodata.component";
// import LoadMoreDataBtn from "../components/load-more.component";
// import PageNotFound from "./404.page";



// export const profileDataStructure = {
//     personal_info: {
//         fullname: "",
//         username: "",
//         profile_img: "",
//         bio: "",
//     },
//     account_info: {
//         total_posts: 0,
//         total_reads: 0
//     },
//     social_links: {},
//     joinedAt: " "
// }

// const ProfilePage = () => {

//     let { id: profileId } = useParams();
//     let [profile, setProfile] = useState(profileDataStructure);
//     let [loading, setLoading] = useState(true);
//     let [blogs, setBlogs] = useState(null);
//     let [profileLoaded, setProfileLoaded] = useState("");

//     let { personal_info: { fullname, username: profile_username,
//         profile_img, bio }, account_info: { total_posts, total_reads },
//         social_links, joinedAt } = profile;
//     let { userAuth: { username } } = useContext(UserContext);


//     const fetchUserProfile = () => {
//         axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/get-profile", {
//             username: profileId
//         }).then(({ data: user }) => {
//             //console.log(user);
//             if (user != null) {
//                 setProfile(user);
//             }
//             setProfileLoaded(profileId);
//             getBlogs({ user_id: user._id });
//             setLoading(false);
//         })
//             .catch(err => {
//                 console.log(err);
//                 setLoading(false);
//             })
//     }


//     const getBlogs = ({ page = 1, user_id }) => {
//         user_id = user_id == undefined ? blogs.user_id : user_id;

//         axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/search-blogs", {
//             author: user_id,
//             page
//         })
//             .then(async ({ data }) => {
//                 let formatedData = await filterPaginationData({
//                     state: blogs,
//                     data: data.blogs,
//                     page,
//                     countRoute: "/search-blogs-count",
//                     data_to_send: { author: user_id }
//                 })

//                 formatedData.user_id = user_id;

//                 setBlogs(formatedData);
//             })
//     }

//     useEffect(() => {

//         if (profileId !== profileLoaded) {
//             setBlogs(null);
//         }

//         if (blogs == null) {
//             resetStates();
//             fetchUserProfile();
//         }



//     }, [profileId, blogs]);

//     const resetStates = () => {
//         setProfile(profileDataStructure);

//         setLoading(true);
//         setProfileLoaded("");
//     }


//     return (
//         <AnimationWrapper>
//             {
//                 loading ? <Loader /> :
//                     profile_username.length ?
//                         <section className="h-cover md:flex flex-row-reverse items-start gap-5 min-[1100px]:gap-12">
//                             <div className="flex flex-col max-md:items-center gap-5 min-w-[250px] md:w-[50%] md:pl-8 md:border-1 border-grey md:sticky md:top-[100px] md;py-10">

//                                 <img src={profile_img} className="w-48 h-48 bg-grey rounded-full md:h-32" />

//                                 <h1 className="text-2xl font-medium">@{profile_username}</h1>
//                                 <p className="text-xl capitalize h-6">{fullname}</p>

//                                 <p> {total_posts.toLocaleString()} Blogs - {total_reads.toLocaleString()} -Reads</p>

//                                 <div className="flex gap-4 mt-2">
//                                     {
//                                         profileId = username ? <Link to="/settings/edit-profile" className="btn-light rounded-md">Edit Profile</Link>
//                                             : " "
//                                     }

//                                 </div>

//                                 <AboutUser className="max-md:hidden" bio={bio} social_links={social_links} joinedAt={joinedAt} />
//                             </div>

//                             <div className="max-md:mt-12 w-full">

//                                 <InPageNavigation routes={["Blogs Published", "About"]} defaultHidden={["About"]}>

//                                     {/* //<h1>Latest Blogs Here</h1> */}
//                                     <>

//                                         {
//                                             blogs == null ? <Loader /> : (
//                                                 blogs.results.length ?
//                                                     blogs.results.map((blog, i) => {
//                                                         return <AnimationWrapper transition={{ duration: 1, delay: i * .1 }} key={i}>
//                                                             <BlogPostCard content={blog} author={blog.author.personal_info} />

//                                                         </AnimationWrapper>
//                                                     }) : <NoDataMessage message="No Blogs Found!" />
//                                             )
//                                         }
//                                         <LoadMoreDataBtn state={blogs} fetchDataFun={getBlogs} />
//                                     </>

//                                     <AboutUser bio={bio} social_links={social_links} joinedAt={joinedAt} />


//                                 </InPageNavigation>
//                             </div>

//                         </section>
//                         : <PageNotFound />


//             }
//         </AnimationWrapper>
//     )

// }

// export default ProfilePage; 

import { useContext, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import { UserContext } from "../App";
import AboutUser from "../components/about.component";
import Loader from "../components/loader.component";
import axios from "axios";
import { filterPaginationData } from "../common/filter-pagination-data";
import InPageNavigation from "../components/inpage-navigation.component";
import BlogPostCard from "../components/blog-post.component";
import NoDataMessage from "../components/nodata.component";
import LoadMoreDataBtn from "../components/load-more.component";
import PageNotFound from "./404.page";

export const profileDataStructure = {
    personal_info: {
        fullname: "",
        username: "",
        profile_img: "",
        bio: "",
    },
    account_info: {
        total_posts: 0,
        total_reads: 0
    },
    social_links: {},
    joinedAt: ""
};

const ProfilePage = () => {
    const { id: profileId } = useParams();
    const [profile, setProfile] = useState(profileDataStructure);
    const [loading, setLoading] = useState(true);
    const [blogs, setBlogs] = useState(null);
    const [profileLoaded, setProfileLoaded] = useState("");

    const { userAuth } = useContext(UserContext);
    const { username } = userAuth || {};

    const { personal_info, account_info, social_links, joinedAt } = profile;
    const { fullname, username: profileUsername, profile_img, bio } = personal_info;
    const { total_posts, total_reads } = account_info;

    const fetchUserProfile = async () => {
        try {
            const { data: user } = await axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}/get-profile`, {
                username: String(profileId)
            });
            if (user) {
                setProfile(user);
                setProfileLoaded(profileId);
                getBlogs({ user_id: user._id });
            }
        } catch (err) {
            console.error("Error fetching user profile:", err);
        } finally {
            setLoading(false);
        }
    };

    const getBlogs = async ({ page = 1, user_id }) => {
        try {
            const authorId = user_id || blogs?.user_id;
            if (!authorId) return;

            const { data } = await axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}/search-blogs`, {
                author: String(authorId),
                page: Number(page)
            });

            const formattedData = await filterPaginationData({
                state: blogs,
                data: data.blogs,
                page,
                countRoute: "/search-blogs-count",
                data_to_send: { author: authorId }
            });

            formattedData.user_id = authorId;
            setBlogs(formattedData);
        } catch (err) {
            console.error("Error fetching blogs:", err);
        }
    };

    useEffect(() => {
        if (profileId !== profileLoaded) {
            setBlogs(null);
            resetStates();
            fetchUserProfile();
        }
    }, [profileId]);

    const resetStates = () => {
        setProfile(profileDataStructure);
        setLoading(true);
        setProfileLoaded("");
    };

    return (
        <AnimationWrapper>
            {loading ? (
                <Loader />
            ) : profileUsername ? (
                <section className="h-cover md:flex flex-row-reverse items-start gap-5 min-[1100px]:gap-12">
                    <div className="flex flex-col max-md:items-center gap-5 min-w-[250px] md:w-[50%] md:pl-8 md:border-1 border-grey md:sticky md:top-[100px] md;py-10">
                        <img src={profile_img} alt="Profile" className="w-48 h-48 bg-grey rounded-full md:h-32" />
                        <h1 className="text-2xl font-medium">@{profileUsername}</h1>
                        <p className="text-xl capitalize h-6">{fullname}</p>
                        <p>{total_posts.toLocaleString()} Blogs - {total_reads.toLocaleString()} Reads</p>
                        {profileId === username && (
                            <Link to="/settings/edit-profile" className="btn-light rounded-md">Edit Profile</Link>
                        )}
                        <AboutUser className="max-md:hidden" bio={bio} social_links={social_links} joinedAt={joinedAt} />
                    </div>

                    <div className="max-md:mt-12 w-full">
                        <InPageNavigation routes={["Blogs Published", "About"]} defaultHidden={["About"]}>
                            {blogs === null ? (
                                <Loader />
                            ) : blogs.results.length ? (
                                blogs.results.map((blog, i) => (
                                    <AnimationWrapper transition={{ duration: 1, delay: i * 0.1 }} key={blog._id || `blog-${i}` }>
                                        <BlogPostCard content={blog} author={blog.author.personal_info} />
                                    </AnimationWrapper>
                                ))
                            ) : (
                                <NoDataMessage message="No Blogs Found!" />
                            )}
                            <LoadMoreDataBtn state={blogs} fetchDataFun={getBlogs} />
                            <AboutUser bio={bio} social_links={social_links} joinedAt={joinedAt} />
                        </InPageNavigation>
                    </div>
                </section>
            ) : (
                <PageNotFound />
            )}
        </AnimationWrapper>
    );
};

export default ProfilePage;
