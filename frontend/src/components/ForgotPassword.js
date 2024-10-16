import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; 


function ForgotPassword() {
    const [formData, setFormData] = useState({
        username: '',
        authentication_key: '',
        password: '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://127.0.0.1:8000/authentication/forgot_password/', formData);
            console.log(response.data);
            alert('Password reset successful');
        } catch (error) {
            console.error(error);
            alert('Failed to reset password. Please check the credentials.');
        }
    };

    return (
        <div>
            <h1>Forgot Password</h1>
            <form onSubmit={handleSubmit}>
                {/* Username field */}
                <input
                    name="username"
                    type="text"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                />

                {/* Authentication Key (OTP) field */}
                <input
                    name="authentication_key"
                    type="text"
                    placeholder="Authentication Key (OTP)"
                    value={formData.authentication_key}
                    onChange={handleChange}
                    required
                />

                {/* New Password field */}
                <input
                    name="password"
                    type="password"
                    placeholder="New Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />

                <button type="submit">Reset Password</button>
            </form>

            <div>
                <Link to="/forgotusername">Forgot Username?</Link>
            </div>
        </div>
    );
}

export default ForgotPassword;