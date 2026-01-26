import React from 'react';
import { useParams } from 'react-router-dom';

const TaskDetail = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="bg-white shadow sm:rounded-lg p-6">
      <div className="text-center text-gray-500">
        Please connect to Supabase to view task details
      </div>
    </div>
  );
};

export default TaskDetail;