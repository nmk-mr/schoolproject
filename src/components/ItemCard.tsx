
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/supabase';
import { AssignmentWithTeacher } from '@/types/database.types';
import { Calendar, Clock } from 'lucide-react';

interface ItemCardProps {
  item: AssignmentWithTeacher;
  onView: (id: string) => void;
  isTeacher?: boolean;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onView, isTeacher = false }) => {
  const isOverdue = new Date(item.due_date) < new Date();
  
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="bg-mtu-light border-b pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold text-mtu-primary">
              {item.title}
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Created by {item.teacher_name || 'Unknown Teacher'}
            </p>
          </div>
          <Badge 
            variant={
              item.category === 'Assignment' ? 'default' : 
              item.category === 'Tutorial' ? 'secondary' : 
              'outline'
            }
          >
            {item.category === 'Lab Report' ? (isTeacher ? 'Lab Instructions' : 'Lab Report') : item.category}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
          {item.description}
        </p>
        
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center text-gray-500">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Created: {formatDate(item.created_at)}</span>
          </div>
          
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            <span className={isOverdue ? "text-red-500 font-medium" : "text-gray-500"}>
              Due: {formatDate(item.due_date)} {isOverdue && "(Overdue)"}
            </span>
          </div>
          
          {isTeacher && item.submission_count !== undefined && (
            <div className="mt-2 text-sm font-medium">
              Submissions: <span className="text-mtu-primary">{item.submission_count}/{item.total_students || 0}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="bg-gray-50 pt-3 pb-3">
        <Button 
          className="w-full"
          variant="outline"
          onClick={() => onView(item.id)}
        >
          View {isTeacher ? 'Submissions' : 'Details'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ItemCard;
