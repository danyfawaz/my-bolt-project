import React, { useEffect, useState } from "react";
import { Plus, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// ✅ Log Supabase Environment Variables
console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
console.log("Supabase Key:", import.meta.env.VITE_SUPABASE_ANON_KEY);

// ✅ Initialize Supabase Client
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const TaskList = () => {
  const [tasks, setTasks] = useState([]);

  // ✅ Fetch Tasks with Deliverables
  useEffect(() => {
    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          id, title, description, status,
          deliverables:deliverables (id, title, description, task_id)
        `); // ✅ Ensuring the alias matches the relation

      console.log("🟢 Full Supabase Response:", JSON.stringify(data, null, 2));

      if (error) {
        console.error("❌ Supabase Error:", error);
      } else {
        setTasks(data);
      }
    };

    fetchTasks();
  }, []);



  // ✅ Fix: Define `getStatusIcon` function
  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "in_progress":
        return <RefreshCw className="h-5 w-5 text-blue-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
  {tasks.length > 0 ? (
    <ul>
      {tasks.map((task) => (
        <li key={task.id} className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-gray-900">{task.title}</p>
              <p className="text-gray-500">{task.description}</p>
            </div>
            {getStatusIcon(task.status)}
          </div>

          {/* ✅ Show Only Deliverables That Belong to This Task */}
          <div className="mt-4 pl-4 border-l-4 border-indigo-500">
            <h3 className="text-lg font-bold text-indigo-600">Deliverables:</h3>
            {task.deliverables && task.deliverables.length > 0 ? (
              <ul>
                {task.deliverables
                  .filter(deliverable => deliverable.task_id === task.id) // ✅ Filter correct deliverables
                  .map((deliverable) => (
                    <li key={deliverable.id} className="mt-2">
                      <p className="font-semibold">{deliverable.title}</p>
                      <p className="text-gray-500">{deliverable.description}</p>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-gray-400">No deliverables for this task.</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  ) : (
    <div className="p-4 text-center text-gray-500">No tasks found</div>
  )}
</div>

  );
};

export default TaskList;
