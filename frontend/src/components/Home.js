import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
    return (
        <div>
            <h1>Welcome</h1>
            <p>Please choose an option:</p>
            <div>
                {/* Link to the Sign Up page */}
                <Link to="/signup">
                    <button>Sign Up</button>
                </Link>
            </div>
            <div>
                {/* Link to the Sign In page */}
                <Link to="/signin">
                    <button>Sign In</button>
                </Link>
            </div>
        </div>
    );
}

export default Home;
