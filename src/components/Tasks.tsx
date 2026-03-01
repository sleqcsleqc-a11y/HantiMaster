import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Plus, CheckSquare, Clock, Calendar, MoreVertical, CheckCircle2, Circle, LayoutGrid, List, DollarSign, Timer, Filter, X, AlertCircle, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { api } from '../services/api';
import { Task } from '../types';

const priorityColors = {
  Emergency: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800',
  High: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-100 dark:border-orange-800',
  Medium: 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border-violet-100 dark:border-violet-800',
  Low: 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-100 dark:border-zinc-700',
};

const columns = ['Pending', 'In Progress', 'Completed'] as const;

export const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<'board' | 'list' | 'report'>('board');
  const [isBrowser, setIsBrowser] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');
  const [sortField, setSortField] = useState<'due_date' | 'priority' | 'status'>('due_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [taskForm, setTaskForm] = useState<Partial<Task>>({
    title: '',
    assignee: '',
    due_date: new Date().toISOString().split('T')[0],
    priority: 'Medium',
    status: 'Pending',
    cost: 0,
    time_spent: 0
  });

  const loadTasks = () => {
    api.getTasks().then(setTasks);
  };

  useEffect(() => {
    setIsBrowser(true);
    loadTasks();
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createTask(taskForm);
    setShowAddTask(false);
    setTaskForm({
      title: '',
      assignee: '',
      due_date: new Date().toISOString().split('T')[0],
      priority: 'Medium',
      status: 'Pending',
      cost: 0,
      time_spent: 0
    });
    loadTasks();
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    
    const { source, destination, draggableId } = result;
    
    if (source.droppableId !== destination.droppableId) {
      const newTasks = [...tasks];
      const taskIndex = newTasks.findIndex(t => t.id.toString() === draggableId);
      if (taskIndex > -1) {
        const updatedTask = { ...newTasks[taskIndex], status: destination.droppableId as Task['status'] };
        newTasks[taskIndex] = updatedTask;
        setTasks(newTasks); // Optimistic update
        await api.updateTask(updatedTask.id, { status: updatedTask.status });
        loadTasks();
      }
    }
  };

  const priorityOrder = { Emergency: 0, High: 1, Medium: 2, Low: 3 };
  const statusOrder = { Pending: 0, 'In Progress': 1, Completed: 2 };

  const processedTasks = useMemo(() => {
    let result = tasks.filter(t => {
      if (statusFilter !== 'All' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'All' && t.priority !== priorityFilter) return false;
      if (assigneeFilter !== 'All' && t.assignee !== assigneeFilter) return false;
      return true;
    });

    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'due_date') {
        comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      } else if (sortField === 'priority') {
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
      } else if (sortField === 'status') {
        comparison = statusOrder[a.status] - statusOrder[b.status];
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [tasks, statusFilter, priorityFilter, assigneeFilter, sortField, sortDirection]);

  const uniqueAssignees = Array.from(new Set(tasks.map(t => t.assignee))).filter((a): a is string => !!a);

  const totalCost = processedTasks.reduce((sum, t) => sum + (t.cost || 0), 0);
  const totalTime = processedTasks.reduce((sum, t) => sum + (t.time_spent || 0), 0);

  const chartData = useMemo(() => {
    const statuses = ['Pending', 'In Progress', 'Completed'];
    return statuses.map(status => ({
      name: status,
      value: processedTasks.filter(t => t.status === status).length
    }));
  }, [processedTasks]);

  const costData = useMemo(() => {
    return processedTasks.slice(0, 10).map(t => ({
      name: t.title.length > 15 ? t.title.substring(0, 15) + '...' : t.title,
      cost: t.cost || 0,
      time: t.time_spent || 0
    }));
  }, [processedTasks]);

  const COLORS = ['#94a3b8', '#6366f1', '#10b981'];

  const getDueDateStatus = (dueDate: string, status: string) => {
    if (status === 'Completed') return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 2) return 'soon';
    return null;
  };

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
          <button 
            onClick={() => setShowAddTask(true)}
            className="vintsy-button-primary flex items-center gap-2 text-[10px] uppercase tracking-widest"
          >
            <Plus size={16} />
            New Task
          </button>
        </div>
      </div>

      <div className="vintsy-card p-6 mb-8 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            <Filter size={16} />
            Filters & Sorting
          </div>
          <button 
            onClick={() => {
              setStatusFilter('All');
              setPriorityFilter('All');
              setAssigneeFilter('All');
              setSortField('due_date');
              setSortDirection('asc');
            }}
            className="text-[10px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400 hover:underline"
          >
            Reset
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Status</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="vintsy-input w-full appearance-none"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Priority</label>
            <select 
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="vintsy-input w-full appearance-none"
            >
              <option value="All">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Assignee</label>
            <select 
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="vintsy-input w-full appearance-none"
            >
              <option value="All">All Assignees</option>
              {uniqueAssignees.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Sort By</label>
            <select 
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
              className="vintsy-input w-full appearance-none"
            >
              <option value="due_date">Due Date</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Order</label>
            <select 
              value={sortDirection}
              onChange={(e) => setSortDirection(e.target.value as any)}
              className="vintsy-input w-full appearance-none"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      </div>

      {showAddTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-8 max-w-2xl w-full shadow-2xl border border-violet-100 dark:border-zinc-800 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Create New Task</h3>
              <button 
                onClick={() => setShowAddTask(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Title</label>
                <input 
                  type="text" 
                  required
                  value={taskForm.title}
                  onChange={e => setTaskForm({...taskForm, title: e.target.value})}
                  className="vintsy-input w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Assignee</label>
                  <select 
                    required
                    value={taskForm.assignee}
                    onChange={e => setTaskForm({...taskForm, assignee: e.target.value})}
                    className="vintsy-input w-full appearance-none"
                  >
                    <option value="">Select Assignee</option>
                    <option value="Maintenance Team">Maintenance Team</option>
                    <option value="Property Manager">Property Manager</option>
                    <option value="Admin">Admin</option>
                    <option value="External Contractor">External Contractor</option>
                    {uniqueAssignees.filter(a => !['Maintenance Team', 'Property Manager', 'Admin', 'External Contractor'].includes(a)).map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                    <option value="Other">Other...</option>
                  </select>
                  {taskForm.assignee === 'Other' && (
                    <input 
                      type="text"
                      placeholder="Enter assignee name"
                      className="vintsy-input w-full mt-2"
                      onChange={e => setTaskForm({...taskForm, assignee: e.target.value})}
                    />
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Due Date</label>
                  <input 
                    type="date" 
                    required
                    value={taskForm.due_date}
                    onChange={e => setTaskForm({...taskForm, due_date: e.target.value})}
                    className="vintsy-input w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Priority</label>
                  <select 
                    value={taskForm.priority}
                    onChange={e => setTaskForm({...taskForm, priority: e.target.value as any})}
                    className="vintsy-input w-full appearance-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Status</label>
                  <select 
                    value={taskForm.status}
                    onChange={e => setTaskForm({...taskForm, status: e.target.value as any})}
                    className="vintsy-input w-full appearance-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Cost ($)</label>
                  <input 
                    type="number" 
                    value={taskForm.cost}
                    onChange={e => setTaskForm({...taskForm, cost: Number(e.target.value)})}
                    className="vintsy-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Time Spent (Hours)</label>
                  <input 
                    type="number" 
                    step="0.5"
                    value={taskForm.time_spent}
                    onChange={e => setTaskForm({...taskForm, time_spent: Number(e.target.value)})}
                    className="vintsy-input w-full"
                  />
                </div>
              </div>
              <button type="submit" className="w-full vintsy-button-primary py-3 mt-6">
                Save Task
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {view === 'report' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="vintsy-card p-4">
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Total Tasks</p>
              <h4 className="text-2xl font-bold text-zinc-900 dark:text-white">{processedTasks.length}</h4>
            </div>
            <div className="vintsy-card p-4">
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Pending</p>
              <h4 className="text-2xl font-bold text-zinc-500">{processedTasks.filter(t => t.status === 'Pending').length}</h4>
            </div>
            <div className="vintsy-card p-4">
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">In Progress</p>
              <h4 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{processedTasks.filter(t => t.status === 'In Progress').length}</h4>
            </div>
            <div className="vintsy-card p-4">
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Completed</p>
              <h4 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{processedTasks.filter(t => t.status === 'Completed').length}</h4>
            </div>
            <div className="vintsy-card p-4">
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Total Cost</p>
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-violet-600 dark:text-violet-400" />
                <h4 className="text-2xl font-bold text-zinc-900 dark:text-white">{totalCost.toLocaleString()}</h4>
              </div>
            </div>
            <div className="vintsy-card p-4">
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Time Spent</p>
              <div className="flex items-center gap-2">
                <Timer size={16} className="text-orange-600 dark:text-orange-400" />
                <h4 className="text-2xl font-bold text-zinc-900 dark:text-white">{totalTime}h</h4>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="vintsy-card p-6">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                <PieChartIcon size={16} />
                Status Distribution
              </h4>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="vintsy-card p-6">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                <BarChart3 size={16} />
                Cost & Time Analysis
              </h4>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                      contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    />
                    <Legend />
                    <Bar dataKey="cost" name="Cost ($)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="time" name="Time (h)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
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
                  {processedTasks.map(task => (
                    <tr key={task.id} className="hover:bg-violet-50/20 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-zinc-900 dark:text-white">{task.title}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${
                          task.status === 'Completed' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' : 
                          task.status === 'In Progress' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800' :
                          'bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-100 dark:border-zinc-700'
                        }`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">${(task.cost || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">{task.time_spent || 0}h</td>
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
                    {processedTasks.filter(t => t.status === columnId).length}
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
                      {processedTasks.filter(t => t.status === columnId).map((task, index) => {
                        const dueStatus = getDueDateStatus(task.due_date, task.status);
                        return (
                        // @ts-ignore
                        <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`vintsy-card p-5 mb-4 cursor-grab active:cursor-grabbing relative overflow-hidden ${
                                snapshot.isDragging ? 'shadow-2xl scale-105 rotate-2' : ''
                              } ${dueStatus === 'overdue' ? 'border-red-200 dark:border-red-900/50' : dueStatus === 'soon' ? 'border-orange-200 dark:border-orange-900/50' : ''}`}
                            >
                              {dueStatus === 'overdue' && (
                                <div className="absolute top-0 right-0 w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-bl-3xl flex items-start justify-end p-2">
                                  <AlertCircle size={14} className="text-red-600 dark:text-red-400" />
                                </div>
                              )}
                              {dueStatus === 'soon' && (
                                <div className="absolute top-0 right-0 w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-bl-3xl flex items-start justify-end p-2">
                                  <Clock size={14} className="text-orange-600 dark:text-orange-400" />
                                </div>
                              )}
                              <div className="flex justify-between items-start mb-3">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border ${priorityColors[task.priority]}`}>
                                  {task.priority}
                                </span>
                              </div>
                              <h5 className="text-sm font-bold text-zinc-900 dark:text-white mb-4 leading-snug pr-6">{task.title}</h5>
                              <div className="flex items-center justify-between pt-4 border-t border-violet-50 dark:border-zinc-800">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 flex items-center justify-center font-bold text-[10px]" title={task.assignee}>
                                    {task.assignee.charAt(0)}
                                  </div>
                                </div>
                                <div className={`flex items-center gap-1.5 text-[10px] font-medium ${dueStatus === 'overdue' ? 'text-red-600 dark:text-red-400 font-bold' : dueStatus === 'soon' ? 'text-orange-600 dark:text-orange-400 font-bold' : 'text-zinc-500'}`}>
                                  <Calendar size={12} />
                                  <span>{new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      )})}
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
                {processedTasks.map((task, index) => {
                  const dueStatus = getDueDateStatus(task.due_date, task.status);
                  return (
                  <motion.tr
                    key={task.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`hover:bg-violet-50/20 dark:hover:bg-zinc-800/30 transition-all duration-300 group cursor-pointer ${dueStatus === 'overdue' ? 'bg-red-50/30 dark:bg-red-900/10' : dueStatus === 'soon' ? 'bg-orange-50/30 dark:bg-orange-900/10' : ''}`}
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <button className="text-zinc-300 dark:text-zinc-600 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                          {task.status === 'Completed' ? <CheckCircle2 size={20} className="text-emerald-500" /> : <Circle size={20} />}
                        </button>
                        <div className="flex flex-col">
                          <p className={`text-sm font-bold ${task.status === 'Completed' ? 'text-zinc-400 dark:text-zinc-600 line-through' : 'text-zinc-900 dark:text-white'}`}>
                            {task.title}
                          </p>
                          {dueStatus === 'overdue' && <span className="text-[9px] font-bold text-red-600 uppercase tracking-widest mt-1 flex items-center gap-1"><AlertCircle size={10} /> Overdue</span>}
                          {dueStatus === 'soon' && <span className="text-[9px] font-bold text-orange-600 uppercase tracking-widest mt-1 flex items-center gap-1"><Clock size={10} /> Due Soon</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 flex items-center justify-center font-bold text-[10px] border border-violet-200 dark:border-violet-800 shadow-sm" title={task.assignee}>
                          {task.assignee.charAt(0)}
                        </div>
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{task.assignee}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className={`flex items-center gap-2 text-xs font-medium ${dueStatus === 'overdue' ? 'text-red-600 dark:text-red-400 font-bold' : dueStatus === 'soon' ? 'text-orange-600 dark:text-orange-400 font-bold' : 'text-zinc-500 dark:text-zinc-400'}`}>
                        <Calendar size={14} className={dueStatus ? '' : 'text-violet-700 dark:text-violet-400'} />
                        <span>{new Date(task.due_date).toLocaleDateString()}</span>
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
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
