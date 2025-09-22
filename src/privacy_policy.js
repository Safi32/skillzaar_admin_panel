import React from "react";

const PrivacyPolicy = () => {
    return (
        <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif", lineHeight: "1.6", color: "#333" }}>
            <h1 style={{ color: "#2c3e50" }}>Privacy Policy</h1>
            <p>Last updated: September 22, 2025</p>

            <p>
                Skillzaar (“we,” “our,” or “us”) values your privacy. This Privacy Policy explains how we
                collect, use, and protect your information when you use our mobile application Skillzaar
                (the “App”). By using the App, you consent to the practices described in this policy.
            </p>

            <h2 style={{ color: "#2c3e50" }}>1. Information We Collect</h2>
            <ul>
                <li>
                    <strong>Personal Information:</strong> When you sign up, we may collect your name, phone
                    number, email, profile picture, and other details you choose to provide.
                </li>
                <li>
                    <strong>Location Data:</strong> With your consent, we collect location data to show nearby
                    jobs and enable map navigation and live tracking. Location is only collected while the App
                    is in use and/or while you are performing a job.
                </li>
                <li>
                    <strong>Camera & Media:</strong> We may request camera access for profile photos,
                    job-related images, or identity verification. Camera and media permissions are always
                    optional and require your explicit consent.
                </li>
                <li>
                    <strong>Device & Usage Information:</strong> We may collect mobile device information such
                    as device model, operating system, app version, and log data to improve app performance
                    and security.
                </li>
                <li>
                    <strong>Job & Skill Information:</strong> Information about skills you offer or jobs you
                    post is collected to provide better matches between workers and job posters.
                </li>
            </ul>

            <h2 style={{ color: "#2c3e50" }}>2. How We Use Your Information</h2>
            <ul>
                <li>To connect job posters with skilled workers.</li>
                <li>To provide location-based job search, navigation, and tracking.</li>
                <li>To verify user identity and enhance trust and safety.</li>
                <li>To improve our services, features, and customer support.</li>
                <li>To send important notifications about jobs, updates, or changes in our terms.</li>
            </ul>

            <h2 style={{ color: "#2c3e50" }}>3. Consent</h2>
            <p>
                We request permissions (location, camera, notifications, etc.) only when needed and only
                with your explicit consent. You can revoke permissions anytime from your device settings.
            </p>

            <h2 style={{ color: "#2c3e50" }}>4. Data Sharing</h2>
            <ul>
                <li>We do not sell or rent your personal information to third parties.</li>
                <li>
                    We may share limited data with trusted third-party service providers (such as mapping or
                    notification services) strictly to provide core app functionality.
                </li>
                <li>We may disclose information if required by law or to protect user safety.</li>
            </ul>

            <h2 style={{ color: "#2c3e50" }}>5. Data Security</h2>
            <p>
                We implement industry-standard security measures to protect your personal information.
                However, no method of transmission over the internet or mobile networks is completely
                secure.
            </p>

            <h2 style={{ color: "#2c3e50" }}>6. Data Retention & Deletion</h2>
            <p>
                We retain your data only as long as necessary to provide services. You may request deletion
                of your account and data at any time by contacting us.
            </p>

            <h2 style={{ color: "#2c3e50" }}>7. Children’s Privacy</h2>
            <p>
                Our services are not directed to children under 13. We do not knowingly collect information
                from children. If we discover such data has been collected, we will delete it immediately.
            </p>

            <h2 style={{ color: "#2c3e50" }}>8. Changes to This Policy</h2>
            <p>
                We may update this Privacy Policy from time to time. Updates will be posted in the App and
                on our website, with the “Last updated” date revised accordingly.
            </p>

            <h2 style={{ color: "#2c3e50" }}>9. Contact Us</h2>
            <p>If you have questions or concerns about this Privacy Policy, please contact us at:</p>
            <p>
                <strong>Email:</strong> support@skillzaar.com
            </p>
        </div>
    );
};

export default PrivacyPolicy;
