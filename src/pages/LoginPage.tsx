import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import mtuLogo from '@/mtu-logo.png';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'Missing fields',
        description: 'Please enter both email and password',
        variant: 'destructive'
      });
      return;
    }
    
    setIsLoading(true);

    try {
      console.log('Attempting login with:', email);
      const { error } = await signIn(email, password);
      
      if (error) {
        console.error('Login error:', error);
        toast({
          title: 'Login failed',
          description: error.message || 'Please check your credentials and try again.',
          variant: 'destructive'
        });
        setIsLoading(false);
      }
      // Don't need to handle success case here as the AuthContext will handle redirection
    } catch (error) {
      console.error('Error during login:', error);
      toast({
        title: 'Login error',
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
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your email and password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
