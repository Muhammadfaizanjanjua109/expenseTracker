CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    preferences JSONB DEFAULT '{
        "theme": "light",
        "currency": "USD",
        "language": "en",
        "timeZone": "UTC"
    }'::jsonb,
    notification_settings JSONB DEFAULT '{
        "emailNotifications": true,
        "budgetAlerts": true,
        "paymentReminders": true,
        "monthlyReports": true
    }'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);