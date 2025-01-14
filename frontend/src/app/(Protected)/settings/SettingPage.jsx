'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { 
  User, 
  Lock, 
  Bell, 
  CreditCard, 
  Moon, 
  Sun,
  Globe,
  Shield 
} from 'lucide-react';
import axios from 'axios';

const SettingsPage = () => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [preferences, setPreferences] = useState({
    theme: 'light',
    currency: 'USD',
    language: 'en',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    budgetAlerts: true,
    paymentReminders: true,
    monthlyReports: true
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchUserProfile();
    fetchUserPreferences();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
    } catch (err) {
      setError('Failed to load user profile');
    }
  };

  const fetchUserPreferences = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users/preferences', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPreferences(response.data);
      setNotifications(response.data.notifications || notifications);
    } catch (err) {
      console.error('Failed to load preferences:', err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      await axios.put(
        'http://localhost:5000/api/users/profile',
        profile,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      await axios.put(
        'http://localhost:5000/api/users/password',
        {
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword
        },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setSuccess('Password updated successfully');
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePreferences = async (updatedPrefs) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const newPreferences = { ...preferences, ...updatedPrefs };
      await axios.put(
        'http://localhost:5000/api/users/preferences',
        newPreferences,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setPreferences(newPreferences);
      setSuccess('Preferences updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationToggle = async (setting) => {
    try {
      const token = localStorage.getItem('token');
      const newNotifications = {
        ...notifications,
        [setting]: !notifications[setting]
      };
      
      await axios.put(
        'http://localhost:5000/api/users/notifications',
        newNotifications,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      setNotifications(newNotifications);
      setSuccess('Notification settings updated');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update notification settings');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {(error || success) && (
        <Alert variant={error ? "destructive" : "default"} className="mb-4">
          <AlertDescription>
            {error || success}
          </AlertDescription>
        </Alert>
      )}

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number (Optional)</label>
              <Input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Password</label>
              <Input
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">New Password</label>
              <Input
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm New Password</label>
              <Input
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Theme</h3>
                <p className="text-sm text-gray-500">Choose your preferred theme</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={preferences.theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleUpdatePreferences({ theme: 'light' })}
                >
                  <Sun className="w-4 h-4 mr-1" />
                  Light
                </Button>
                <Button
                  variant={preferences.theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleUpdatePreferences({ theme: 'dark' })}
                >
                  <Moon className="w-4 h-4 mr-1" />
                  Dark
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Currency</h3>
                <p className="text-sm text-gray-500">Set your preferred currency</p>
              </div>
              <select
                className="p-2 border rounded-md"
                value={preferences.currency}
                onChange={(e) => handleUpdatePreferences({ currency: e.target.value })}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Language</h3>
                <p className="text-sm text-gray-500">Choose your preferred language</p>
              </div>
              <select
                className="p-2 border rounded-md"
                value={preferences.language}
                onChange={(e) => handleUpdatePreferences({ language: e.target.value })}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Email Notifications</h3>
                <p className="text-sm text-gray-500">Receive important updates via email</p>
              </div>
              <Switch
                checked={notifications.emailNotifications}
                onCheckedChange={() => handleNotificationToggle('emailNotifications')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Budget Alerts</h3>
                <p className="text-sm text-gray-500">Get notified when approaching budget limits</p>
              </div>
              <Switch
                checked={notifications.budgetAlerts}
                onCheckedChange={() => handleNotificationToggle('budgetAlerts')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Payment Reminders</h3>
                <p className="text-sm text-gray-500">Receive reminders for upcoming payments</p>
              </div>
              <Switch
                checked={notifications.paymentReminders}
                onCheckedChange={() => handleNotificationToggle('paymentReminders')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Monthly Reports</h3>
                <p className="text-sm text-gray-500">Get monthly expense summary reports</p>
              </div>
              <Switch
                checked={notifications.monthlyReports}
                onCheckedChange={() => handleNotificationToggle('monthlyReports')}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;