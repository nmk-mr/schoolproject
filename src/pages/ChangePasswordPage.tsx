import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import mtuLogo from '@/mtu-logo.png';

const ChangePasswordPage: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all password fields',
        variant: 'destructive'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'New password and confirm password must be the same',
        variant: 'destructive'
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive'
      });
      return;
    }
    
    setIsLoading(true);

    try {
      // First, verify the current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        toast({
          title: 'Current password incorrect',
          description: 'Please enter your current password correctly',
          variant: 'destructive'
        });
        setIsLoading(false);
        return;
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        toast({
          title: 'Password update failed',
          description: updateError.message || 'Failed to update password. Please try again.',
          variant: 'destructive'
        });
        setIsLoading(false);
        return;
      }

      // Update the password_changed flag in the users table
      const { error: dbError } = await supabase
        .from('users')
        .update({ password_changed: true })
        .eq('id', user?.id);

      if (dbError) {
        console.error('Error updating password_changed flag:', dbError);
        // Don't show error to user as password was changed successfully
      }

      toast({
        title: 'Password changed successfully',
        description: 'Your password has been updated. You will be redirected to your dashboard.',
        variant: 'default'
      });

      // Reload the page to trigger the auth flow again
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Error during password change:', error);
      toast({
        title: 'Password change error',
        description: 'An unexpected error occurred. Please try again later.',
        variant: 'destructive'
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-mtu-secondary p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src={mtuLogo} 
              alt="MTU Logo" 
              className="h-24 w-24 rounded-full bg-white p-2 border-2 border-mtu-primary object-contain"
            />
          </div>
          <h1 className="text-xl text-gray-700">
            Mandalay Technological University
          </h1>
          <h2 className="text-2xl font-bold text-mtu-primary">
            Department of Electronic Engineering
          </h2>
          <p className="text-gray-500 mt-2">
            Assignment Management System
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Change Your Password</CardTitle>
            <CardDescription>
              For security reasons, you must change your password before continuing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="Enter your current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </form>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-mtu-primary hover:bg-mtu-dark"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? 'Changing Password...' : 'Change Password'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ChangePasswordPage; 