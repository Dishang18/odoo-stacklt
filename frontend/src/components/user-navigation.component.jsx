import { Link, useNavigate } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import { useContext } from "react";
import { UserContext } from "../App";
import { removeFromSession } from "../common/session";

const UserNavigationPanel = () => {
    const { userAuth: { username }, setUserAuth } = useContext(UserContext);
    const navigate = useNavigate(); // Use navigate for redirection

    const signOutUser = () => {
        // Clear session storage
        removeFromSession("user");

        // Update UserContext (reset user authentication state)
        setUserAuth({access_token: null});

        // Redirect to the Sign-In page
        navigate("/signin", { replace: true }); // Replace ensures the back button doesn't return to the logged-in state
    };

    return (
        <AnimationWrapper 
            className="absolute right-0 z-50"
            transition={{ duration: 0.2 }}
        >
            <div className="bg-white absolute right-0 border border-grey w-60 duration-200">
                <Link to="/editor" className="flex gap-2 link md:hidden pl-8 py-4">
                    <i className="fi fi-rr-file-edit"></i>
                    <p>Write</p>
                </Link>

                <Link to={`/user/${username}`} className="link pl-8 py-4">
                    Profile
                </Link>

                <Link to={`/dashboard/blogs`} className="link pl-8 py-4">
                    Dashboard
                </Link>

                <Link to={`/settings/edit-profile`} className="link pl-8 py-4">
                    Settings
                </Link>

                <span className="absolute border-t border-grey w-[100%]"></span>         

                <button className="text-left p-4 hover:bg-grey w-full pl-8 py-4"
                    onClick={signOutUser}
                >
                    <h1 className="font-bold text-xl mg-1">Sign Out</h1>
                    <p className="text-dark-grey">@{username}</p>
                </button>
            </div>
        </AnimationWrapper>
    );
};

export default UserNavigationPanel;