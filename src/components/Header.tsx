
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="bg-mtu-primary text-white py-4 px-6 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <img 
            src="/src/mtu-logo.png" 
            alt="MTU Logo" 
            className="h-10 w-auto"
          />
          <h1 className="text-xl font-bold">
            Mandalay Technological University - Department of Electronic Engineering
          </h1>
        </div>
        
        {user && (
          <div className="flex items-center gap-4">
            <span className="hidden md:inline">{user.name || user.email}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar_url || ""} alt={user.name || ""}/>
                    <AvatarFallback className="bg-mtu-accent text-mtu-dark">
                      {user.name ? getInitials(user.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem onClick={handleSignOut}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
