import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, CheckSquare, Clock, Calendar, MoreVertical, CheckCircle2, Circle, LayoutGrid, List, DollarSign, Timer } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface Task {
  id: string;
  title: string;
  assignee: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High' | 'Emergency';
  status: 'Pending' | 'In Progress' | 'Completed';
  cost: number;
  timeSpent: number; // in hours
}

const initialTasks: Task[] = [
  { id: '1', title: 'Inspect Unit 204 roof leak', assignee: 'Maintenance Team', dueDate: '2024-03-01', priority: 'High', status: 'Pending', cost: 0, timeSpent: 0 },
  { id: '2', title: 'Process lease renewal for Unit 101', assignee: 'Admin', dueDate: '2024-03-05', priority: 'Medium', status: 'In Progress', cost: 0, timeSpent: 2.5 },
  { id: '3', title: 'Schedule annual fire safety inspection', assignee: 'Admin', dueDate: '2024-03-15', priority: 'Medium', status: 'Pending', cost: 0, timeSpent: 0 },
  { id: '4', title: 'Fix broken window in lobby', assignee: 'Maintenance Team', dueDate: '2024-02-28', priority: 'Emergency', status: 'Completed', cost: 450, timeSpent: 4 },
  { id: '5', title: 'HVAC Maintenance Unit 302', assignee: 'Contractor', dueDate: '2024-02-25', priority: 'High', status: 'Completed', cost: 1200, timeSpent: 6 },
];

const priorityColors = {
  Emergency: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800',
  High: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-100 dark:border-orange-800',
  Medium: 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border-violet-100 dark:border-violet-800',
  Low: 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-100 dark:border-zinc-700',
};

const columns = ['Pending', 'In Progress', 'Completed'] as const;

export const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [view, setView] = useState<'board' | 'list' | 'report'>('board');
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const { source, destination } = result;
    
    if (source.droppableId !== destination.droppableId) {
      const newTasks = [...tasks];
      const taskIndex = newTasks.findIndex(t => t.id === result.draggableId);
      if (taskIndex > -1) {
        newTasks[taskIndex].status = destination.droppableId as Task['status'];
        setTasks(newTasks);
      }
    }
  };

  const totalCost = tasks.reduce((sum, t) => sum + t.cost, 0);
  const totalTime = tasks.reduce((sum, t) => sum + t.timeSpent, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">Operations</h3>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Task Management</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-white/50 dark:bg-zinc-800/50 border border-violet-100 dark:border-zinc-700 rounded-xl p-1 shadow-sm">
            <button 
              onClick={() => setView('board')}
              className={`p-2 rounded-lg transition-colors ${view === 'board' ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              onClick={() => setView('list')}
              className={`p-2 rounded-lg transition-colors ${view === 'list' ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
            >
              <List size={16} />
            </button>
            <button 
              onClick={() => setView('report')}
              className={`p-2 rounded-lg transition-colors flex items-center gap-2 px-3 ${view === 'report' ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest">Report</span>
            </button>
          </div>
          <button className="vintsy-button-primary flex items-center gap-2 text-[10px] uppercase tracking-widest">
            <Plus size={16} />
            New Task
          </button>
        </div>
      </div>

      {view === 'report' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="vintsy-card p-6">
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Total Tasks</p>
              <h4 className="text-3xl font-bold text-zinc-900 dark:text-white">{tasks.length}</h4>
            </div>
            <div className="vintsy-card p-6">
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Completed</p>
              <h4 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{tasks.filter(t => t.status === 'Completed').length}</h4>
            </div>
            <div className="vintsy-card p-6">
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Total Cost</p>
              <div className="flex items-center gap-2">
                <DollarSign size={20} className="text-violet-600 dark:text-violet-400" />
                <h4 className="text-3xl font-bold text-zinc-900 dark:text-white">{totalCost.toLocaleString()}</h4>
              </div>
            </div>
            <div className="vintsy-card p-6">
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Time Spent</p>
              <div className="flex items-center gap-2">
                <Timer size={20} className="text-orange-600 dark:text-orange-400" />
                <h4 className="text-3xl font-bold text-zinc-900 dark:text-white">{totalTime}h</h4>
              </div>
            </div>
          </div>
          
          <div className="vintsy-card p-6">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-6 uppercase tracking-widest">Task Breakdown</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-violet-50/20 dark:bg-zinc-800/20 border-b border-violet-100 dark:border-zinc-800">
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Task</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Cost</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Time Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-violet-50 dark:divide-zinc-800">
                  {tasks.map(task => (
                    <tr key={task.id} className="hover:bg-violet-50/20 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-zinc-900 dark:text-white">{task.title}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${
                          task.status === 'Completed' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-100 dark:border-zinc-700'
                        }`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">${task.cost.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">{task.timeSpent}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {view === 'board' && isBrowser && (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {columns.map(columnId => (
              <div key={columnId} className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{columnId}</h4>
                  <span className="w-6 h-6 rounded-full bg-violet-100 dark:bg-zinc-800 text-violet-700 dark:text-zinc-400 flex items-center justify-center text-[10px] font-bold">
                    {tasks.filter(t => t.status === columnId).length}
                  </span>
                </div>
                <Droppable droppableId={columnId}>
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 min-h-[500px] rounded-2xl p-4 transition-colors ${
                        snapshot.isDraggingOver ? 'bg-violet-50/50 dark:bg-zinc-800/50 border-2 border-dashed border-violet-200 dark:border-zinc-700' : 'bg-zinc-50/50 dark:bg-zinc-900/20 border-2 border-transparent'
                      }`}
                    >
                      {tasks.filter(t => t.status === columnId).map((task, index) => (
                        // @ts-ignore
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`vintsy-card p-5 mb-4 cursor-grab active:cursor-grabbing ${
                                snapshot.isDragging ? 'shadow-2xl scale-105 rotate-2' : ''
                              }`}
                            >
                              <div className="flex justify-between items-start mb-3">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border ${priorityColors[task.priority]}`}>
                                  {task.priority}
                                </span>
                                <button className="text-zinc-400 hover:text-violet-600 transition-colors">
                                  <MoreVertical size={14} />
                                </button>
                              </div>
                              <h5 className="text-sm font-bold text-zinc-900 dark:text-white mb-4 leading-snug">{task.title}</h5>
                              <div className="flex items-center justify-between pt-4 border-t border-violet-50 dark:border-zinc-800">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 flex items-center justify-center font-bold text-[10px]">
                                    {task.assignee.charAt(0)}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-500">
                                  <Calendar size={12} />
                                  <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}

      {view === 'list' && (
        <div className="vintsy-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-violet-50/20 dark:bg-zinc-800/20 border-b border-violet-100 dark:border-zinc-800">
                  <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.15em]">Task</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.15em]">Assignee</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.15em]">Due Date</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.15em]">Priority</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.15em]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-violet-50 dark:divide-zinc-800">
                {tasks.map((task, index) => (
                  <motion.tr
                    key={task.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-violet-50/20 dark:hover:bg-zinc-800/30 transition-all duration-300 group cursor-pointer"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <button className="text-zinc-300 dark:text-zinc-600 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                          {task.status === 'Completed' ? <CheckCircle2 size={20} className="text-emerald-500" /> : <Circle size={20} />}
                        </button>
                        <p className={`text-sm font-bold ${task.status === 'Completed' ? 'text-zinc-400 dark:text-zinc-600 line-through' : 'text-zinc-900 dark:text-white'}`}>
                          {task.title}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 flex items-center justify-center font-bold text-[10px] border border-violet-200 dark:border-violet-800 shadow-sm">
                          {task.assignee.charAt(0)}
                        </div>
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{task.assignee}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                        <Calendar size={14} className="text-violet-700 dark:text-violet-400" />
                        <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${priorityColors[task.priority]}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${
                        task.status === 'Completed' 
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' 
                          : task.status === 'In Progress'
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800'
                          : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-100 dark:border-zinc-700'
                      }`}>
                        {task.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
