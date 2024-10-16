import React, { useState } from 'react';
import axios from 'axios';

function ForgotUsername() {
    const [formData, setFormData] = useState({
        email: '',
        phone_number: '',
        authentication_key: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://127.0.0.1:8000/authentication/forgot_username/', formData);
            console.log(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div>
            <h1>Forgot Username</h1>
            <form onSubmit={handleSubmit}>
                {/* form fields */}
                <button type="submit">Retrieve Username</button>
            </form>
        </div>
    );
}

export default ForgotUsername;
