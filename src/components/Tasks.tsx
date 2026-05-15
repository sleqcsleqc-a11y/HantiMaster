import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, CheckSquare, Clock, Calendar, MoreVertical, CheckCircle2, Circle, LayoutGrid, List, DollarSign, Timer, Filter, X, AlertCircle, PieChart as PieChartIcon, BarChart3, Bell } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { api } from '../services/api';
import { Task } from '../types';
import { useAuth } from '../contexts/AuthContext';

const priorityColors = {
  Emergency: 'bg-red-50 text-red-700 border-red-100',
  High: 'bg-orange-50 text-orange-700 border-orange-100',
  Medium: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  Low: 'bg-zinc-50 text-zinc-500 border-zinc-100',
};

const columns = ['Pending', 'In Progress', 'Completed'] as const;

export const Tasks: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [view, setView] = useState<'board' | 'list' | 'report'>('board');
  const [isBrowser, setIsBrowser] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showNotification, setShowNotification] = useState<{title: string, message: string} | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [minCostFilter, setMinCostFilter] = useState<number | ''>('');
  const [maxCostFilter, setMaxCostFilter] = useState<number | ''>('');
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

  const loadData = async () => {
    try {
      const [tasksData, usersData] = await Promise.all([
        api.getTasks(),
        api.getUsers()
      ]);
      setTasks(tasksData);
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load tasks data:', error);
    }
  };

  useEffect(() => {
    setIsBrowser(true);
    loadData();
  }, []);

  useEffect(() => {
    if (tasks.length > 0) {
      const overdue = reminders.filter(r => r.reminderType === 'overdue');
      const upcoming = reminders.filter(r => r.reminderType === 'today' || r.reminderType === 'soon');
      
      if (overdue.length > 0) {
        setShowNotification({
          title: 'Overdue Tasks Alert',
          message: `You have ${overdue.length} overdue tasks and ${upcoming.length} upcoming deadlines.`
        });
      } else if (upcoming.length > 0) {
        setShowNotification({
          title: 'Upcoming Deadlines',
          message: `You have ${upcoming.length} tasks due soon.`
        });
      }
    }
  }, [tasks.length]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await api.updateTask(editingTask.id, taskForm);
      } else {
        await api.createTask(taskForm);
      }
      setShowAddTask(false);
      setEditingTask(null);
      setTaskForm({
        title: '',
        assignee: '',
        due_date: new Date().toISOString().split('T')[0],
        priority: 'Medium',
        status: 'Pending',
        cost: 0,
        time_spent: 0
      });
      loadData();
    } catch (error) {
      console.error('Failed to save task:', error);
      alert('Failed to save task. Please check your connection and permissions.');
    }
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      assignee: task.assignee,
      due_date: task.due_date,
      priority: task.priority,
      status: task.status,
      cost: task.cost || 0,
      time_spent: task.time_spent || 0
    });
    setShowAddTask(true);
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
        loadData();
      }
    }
  };

  const handleSendReminder = async (task: Task) => {
    const assigneeUser = users.find(u => `${u.first_name} ${u.last_name}` === task.assignee);
    
    if (assigneeUser && user) {
      try {
        await api.sendMessage({
          sender_id: user.id,
          sender_type: 'System',
          receiver_id: assigneeUser.id,
          receiver_type: 'User',
          content: `Reminder: Task "${task.title}" is due on ${task.due_date}. Priority: ${task.priority}.`,
          timestamp: new Date().toISOString(),
          read: false
        });
        
        setShowNotification({
          title: 'Reminder Sent',
          message: `System notification sent to ${task.assignee}.`
        });
      } catch (error) {
        console.error('Failed to send reminder:', error);
        setShowNotification({
          title: 'Error',
          message: 'Failed to send reminder notification.'
        });
      }
    } else {
      // Fallback simulation for external assignees or if user not found
      setShowNotification({
        title: 'Reminder Sent',
        message: `Email reminder sent to ${task.assignee} (Simulation).`
      });
    }
  };

  const handleSendBulkReminders = async () => {
    const overdueTasks = reminders.filter(r => r.reminderType === 'overdue');
    if (overdueTasks.length === 0) return;

    let successCount = 0;
    for (const task of overdueTasks) {
      const assigneeUser = users.find(u => `${u.first_name} ${u.last_name}` === task.assignee);
      if (assigneeUser && user) {
        try {
          await api.sendMessage({
            sender_id: user.id,
            sender_type: 'System',
            receiver_id: assigneeUser.id,
            receiver_type: 'User',
            content: `URGENT Reminder: Task "${task.title}" is OVERDUE. It was due on ${task.due_date}.`,
            timestamp: new Date().toISOString(),
            read: false
          });
          successCount++;
        } catch (e) {
          console.error('Failed to send bulk reminder:', e);
        }
      }
    }

    setShowNotification({
      title: 'Bulk Reminders Sent',
      message: `Sent ${successCount} in-app reminders to assignees of overdue tasks.`
    });
  };

  const priorityOrder = { Emergency: 0, High: 1, Medium: 2, Low: 3 };
  const statusOrder = { Pending: 0, 'In Progress': 1, Completed: 2 };

  const processedTasks = useMemo(() => {
    let result = tasks.filter(t => {
      if (statusFilter !== 'All' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'All' && t.priority !== priorityFilter) return false;
      if (assigneeFilter !== 'All' && t.assignee !== assigneeFilter) return false;
      if (overdueOnly) {
        const isOverdue = getDueDateStatus(t.due_date, t.status) === 'overdue';
        if (!isOverdue) return false;
      }
      if (minCostFilter !== '' && (t.cost || 0) < minCostFilter) return false;
      if (maxCostFilter !== '' && (t.cost || 0) > maxCostFilter) return false;
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

  const uniqueAssignees = useMemo(() => {
    const fromTasks = Array.from(new Set(tasks.map(t => t.assignee))).filter((a): a is string => !!a);
    const fromUsers = users.map(u => `${u.first_name} ${u.last_name}`);
    return Array.from(new Set([...fromTasks, ...fromUsers]));
  }, [tasks, users]);

  const totalCost = processedTasks.reduce((sum, t) => sum + (t.cost || 0), 0);
  const totalTime = processedTasks.reduce((sum, t) => sum + (t.time_spent || 0), 0);

  const chartData = useMemo(() => {
    const statuses = ['Pending', 'In Progress', 'Completed'];
    // For the pie chart distribution, we want to show distribution relative to priority/assignee filters but NOT the status filter itself
    const distributionBase = tasks.filter(t => {
      if (priorityFilter !== 'All' && t.priority !== priorityFilter) return false;
      if (assigneeFilter !== 'All' && t.assignee !== assigneeFilter) return false;
      return true;
    });

    return statuses.map(status => ({
      name: status,
      value: distributionBase.filter(t => t.status === status).length
    }));
  }, [tasks, priorityFilter, assigneeFilter]);

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

  const reminders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return tasks.filter(t => t.status !== 'Completed').map(t => {
      const due = new Date(t.due_date);
      due.setHours(0, 0, 0, 0);
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return { ...t, reminderType: 'overdue', days: Math.abs(diffDays) };
      if (diffDays === 0) return { ...t, reminderType: 'today', days: 0 };
      if (diffDays <= 2) return { ...t, reminderType: 'soon', days: diffDays };
      return null;
    }).filter((t): t is (Task & { reminderType: string, days: number }) => t !== null)
      .sort((a, b) => {
        if (a.reminderType === 'overdue' && b.reminderType !== 'overdue') return -1;
        if (a.reminderType !== 'overdue' && b.reminderType === 'overdue') return 1;
        return a.days - b.days;
      });
  }, [tasks]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <AnimatePresence>
        {showNotification && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-between shadow-lg shadow-red-500/10"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                <Bell size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900">{showNotification.title}</p>
                <p className="text-xs text-zinc-500">{showNotification.message}</p>
              </div>
            </div>
            <button 
              onClick={() => setShowNotification(null)}
              className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-1">Operations</h3>
          <p className="text-2xl font-bold text-zinc-900 tracking-tight">Task Management</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-white/50 border border-violet-100 rounded-xl p-1 shadow-sm">
            <button 
              onClick={() => setView('board')}
              className={`p-2 rounded-lg transition-colors ${view === 'board' ? 'bg-violet-100 text-violet-700' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              onClick={() => setView('list')}
              className={`p-2 rounded-lg transition-colors ${view === 'list' ? 'bg-violet-100 text-violet-700' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              <List size={16} />
            </button>
            <button 
              onClick={() => setView('report')}
              className={`p-2 rounded-lg transition-colors flex items-center gap-2 px-3 ${view === 'report' ? 'bg-violet-100 text-violet-700' : 'text-zinc-400 hover:text-zinc-600'}`}
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

      {reminders.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-orange-500" />
              Reminders & Alerts
            </div>
            <button 
              onClick={handleSendBulkReminders}
              className="text-[9px] px-3 py-1 bg-violet-100 text-violet-700 rounded-full hover:bg-violet-200 transition-colors border border-violet-200"
            >
              Bulk Notify Overdue
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reminders.slice(0, 3).map(reminder => (
              <motion.div 
                key={reminder.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-4 rounded-2xl border flex items-center gap-4 ${
                  reminder.reminderType === 'overdue' 
                    ? 'bg-red-50/50 border-red-100' 
                    : 'bg-orange-50/50 border-orange-100'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  reminder.reminderType === 'overdue' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                }`}>
                  {reminder.reminderType === 'overdue' ? <AlertCircle size={20} /> : <Clock size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-900 truncate">{reminder.title}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${
                    reminder.reminderType === 'overdue' ? 'text-red-600' : 'text-orange-600'
                  }`}>
                    {reminder.reminderType === 'overdue' ? `Overdue by ${reminder.days} days` : reminder.reminderType === 'today' ? 'Due Today' : `Due in ${reminder.days} days`}
                  </p>
                </div>
                <button 
                  onClick={() => handleSendReminder(reminder)}
                  className="p-2 bg-white rounded-lg shadow-sm text-zinc-400 hover:text-violet-600 transition-colors"
                  title="Send Reminder"
                >
                  <Bell size={16} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="vintsy-card p-6 mb-8 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-400">
            <Filter size={16} />
            Filters & Sorting
          </div>
            <button 
              onClick={() => {
                setStatusFilter('All');
                setPriorityFilter('All');
                setAssigneeFilter('All');
                setOverdueOnly(false);
                setMinCostFilter('');
                setMaxCostFilter('');
                setSortField('due_date');
                setSortDirection('asc');
              }}
              className="text-[10px] font-bold uppercase tracking-widest text-violet-600 hover:underline"
            >
              Reset
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Deadline Filter</label>
              <div className="flex items-center gap-2 h-10 px-4 bg-zinc-50 rounded-xl border border-violet-100">
                <input 
                  type="checkbox"
                  id="overdue-only"
                  checked={overdueOnly}
                  onChange={(e) => setOverdueOnly(e.target.checked)}
                  className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500 h-4 w-4"
                />
                <label htmlFor="overdue-only" className="text-xs font-bold text-zinc-600 cursor-pointer">Overdue Only</label>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Estimated Cost Range</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  placeholder="Min"
                  value={minCostFilter}
                  onChange={(e) => setMinCostFilter(e.target.value ? Number(e.target.value) : '')}
                  className="vintsy-input w-full"
                />
                <input 
                  type="number" 
                  placeholder="Max"
                  value={maxCostFilter}
                  onChange={(e) => setMaxCostFilter(e.target.value ? Number(e.target.value) : '')}
                  className="vintsy-input w-full"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl border border-violet-100 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-zinc-900">{editingTask ? 'Task Details & Edit' : 'Create New Task'}</h3>
              <button 
                onClick={() => {
                  setShowAddTask(false);
                  setEditingTask(null);
                }}
                className="text-zinc-400 hover:text-zinc-600 transition-colors"
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
                    <optgroup label="System Users">
                      {users.map(u => (
                        <option key={u.id} value={`${u.first_name} ${u.last_name}`}>
                          {u.first_name} {u.last_name} ({u.role_name})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Common Teams">
                      <option value="Maintenance Team">Maintenance Team</option>
                      <option value="Property Manager">Property Manager</option>
                      <option value="Admin">Admin</option>
                      <option value="External Contractor">External Contractor</option>
                    </optgroup>
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
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Estimated Cost ($)</label>
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
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Total Tasks</p>
              <h4 className="text-2xl font-bold text-zinc-900">{processedTasks.length}</h4>
            </div>
            <div className="vintsy-card p-4">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Pending</p>
              <h4 className="text-2xl font-bold text-zinc-500">{processedTasks.filter(t => t.status === 'Pending').length}</h4>
            </div>
            <div className="vintsy-card p-4">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">In Progress</p>
              <h4 className="text-2xl font-bold text-indigo-600">{processedTasks.filter(t => t.status === 'In Progress').length}</h4>
            </div>
            <div className="vintsy-card p-4">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Completed</p>
              <h4 className="text-2xl font-bold text-emerald-600">{processedTasks.filter(t => t.status === 'Completed').length}</h4>
            </div>
            <div className="vintsy-card p-4">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Total Estimated Cost</p>
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-violet-600" />
                <h4 className="text-2xl font-bold text-zinc-900">{totalCost.toLocaleString()}</h4>
              </div>
            </div>
            <div className="vintsy-card p-4">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Time Spent</p>
              <div className="flex items-center gap-2">
                <Timer size={16} className="text-orange-600" />
                <h4 className="text-2xl font-bold text-zinc-900">{totalTime}h</h4>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="vintsy-card p-6">
              <h4 className="text-sm font-bold text-zinc-900 mb-6 uppercase tracking-widest flex items-center gap-2">
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
              <h4 className="text-sm font-bold text-zinc-900 mb-6 uppercase tracking-widest flex items-center gap-2">
                <BarChart3 size={16} />
                Estimated Cost & Time Analysis
              </h4>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #f3f4f6', borderRadius: '8px', color: '#18181b' }}
                    />
                    <Legend />
                    <Bar dataKey="cost" name="Estimated Cost ($)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="time" name="Time (h)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          <div className="vintsy-card p-6">
            <h4 className="text-sm font-bold text-zinc-900 mb-6 uppercase tracking-widest">Task Breakdown</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-violet-50/20 border-b border-violet-100">
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Task</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Estimated Cost</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Time Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-violet-50">
                  {processedTasks.map(task => (
                    <tr key={task.id} className="hover:bg-violet-50/20 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-zinc-900">{task.title}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${
                          task.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                          task.status === 'In Progress' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                          'bg-zinc-50 text-zinc-500 border-zinc-100'
                        }`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-600">${(task.cost || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-zinc-600">{task.time_spent || 0}h</td>
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
                  <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">{columnId}</h4>
                  <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[10px] font-bold">
                    {processedTasks.filter(t => t.status === columnId).length}
                  </span>
                </div>
                <Droppable droppableId={columnId}>
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 min-h-[500px] rounded-2xl p-4 transition-colors ${
                        snapshot.isDraggingOver ? 'bg-violet-50/50 border-2 border-dashed border-violet-200' : 'bg-zinc-50/50 border-2 border-transparent'
                      }`}
                    >
                      {processedTasks.filter(t => t.status === columnId).map((task, index) => {
                        const dueStatus = getDueDateStatus(task.due_date, task.status);
                        return (
                        <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                               className={`vintsy-card p-5 mb-4 cursor-grab active:cursor-grabbing relative overflow-hidden ${
                                snapshot.isDragging ? 'shadow-2xl scale-105 rotate-2' : ''
                              } ${dueStatus === 'overdue' ? 'border-red-200' : dueStatus === 'soon' ? 'border-orange-200' : ''}`}
                            >
                              {dueStatus === 'overdue' && (
                                <div className="absolute top-0 right-0 w-12 h-12 bg-red-50 rounded-bl-3xl flex items-start justify-end p-2">
                                  <AlertCircle size={14} className="text-red-600" />
                                </div>
                              )}
                              {dueStatus === 'soon' && (
                                <div className="absolute top-0 right-0 w-12 h-12 bg-orange-50 rounded-bl-3xl flex items-start justify-end p-2">
                                  <Clock size={14} className="text-orange-600" />
                                </div>
                              )}
                              <div className="flex justify-between items-start mb-3">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border ${priorityColors[task.priority]}`}>
                                  {task.priority}
                                </span>
                                <button 
                                  onClick={() => openEditTask(task)}
                                  className="p-1 text-zinc-400 hover:text-violet-600 transition-colors"
                                >
                                  <MoreVertical size={14} />
                                </button>
                              </div>
                              <h5 className="text-sm font-bold text-zinc-900 mb-4 leading-snug pr-6">{task.title}</h5>
                              <div className="flex items-center justify-between pt-4 border-t border-violet-50">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-[10px]" title={task.assignee}>
                                    {task.assignee?.charAt(0)}
                                  </div>
                                  {task.status !== 'Completed' && (
                                    <button 
                                      onClick={() => handleSendReminder(task)}
                                      className="p-1 text-zinc-400 hover:text-violet-600 transition-colors"
                                      title="Send Reminder"
                                    >
                                      <Bell size={12} />
                                    </button>
                                  )}
                                </div>
                                <div className={`flex items-center gap-1.5 text-[10px] font-medium ${dueStatus === 'overdue' ? 'text-red-600 font-bold' : dueStatus === 'soon' ? 'text-orange-600 font-bold' : 'text-zinc-500'}`}>
                                  <Calendar size={12} />
                                  <span>{new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                </div>
                              </div>
                              {(task.cost > 0 || task.time_spent > 0) && (
                                <div className="mt-3 pt-3 border-t border-violet-50/50 flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                                  {task.cost > 0 && (
                                    <div className="flex items-center gap-1" title="Estimated Cost">
                                      <DollarSign size={10} className="text-violet-600/50" />
                                      <span>Est: ${task.cost}</span>
                                    </div>
                                  )}
                                  {task.time_spent > 0 && (
                                    <div className="flex items-center gap-1">
                                      <Timer size={10} className="text-orange-600/50" />
                                      <span>{task.time_spent}h</span>
                                    </div>
                                  )}
                                </div>
                              )}
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
                <tr className="bg-violet-50/20 border-b border-violet-100">
                  <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em]">Task</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em]">Assignee</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em]">Due Date</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em]">Priority</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em]">Metrics</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-violet-50">
                {processedTasks.map((task, index) => {
                  const dueStatus = getDueDateStatus(task.due_date, task.status);
                  return (
                  <motion.tr
                    key={task.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => openEditTask(task)}
                    className={`hover:bg-violet-50/20 transition-all duration-300 group cursor-pointer ${dueStatus === 'overdue' ? 'bg-red-50/30' : dueStatus === 'soon' ? 'bg-orange-50/30' : ''}`}
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <button className="text-zinc-300 hover:text-violet-600 transition-colors">
                          {task.status === 'Completed' ? <CheckCircle2 size={20} className="text-emerald-500" /> : <Circle size={20} />}
                        </button>
                        <div className="flex flex-col">
                          <p className={`text-sm font-bold ${task.status === 'Completed' ? 'text-zinc-400 line-through' : 'text-zinc-900'}`}>
                            {task.title}
                          </p>
                          {dueStatus === 'overdue' && <span className="text-[9px] font-bold text-red-600 uppercase tracking-widest mt-1 flex items-center gap-1"><AlertCircle size={10} /> Overdue</span>}
                          {dueStatus === 'soon' && <span className="text-[9px] font-bold text-orange-600 uppercase tracking-widest mt-1 flex items-center gap-1"><Clock size={10} /> Due Soon</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-[10px] border border-violet-200 shadow-sm" title={task.assignee}>
                          {task.assignee?.charAt(0)}
                        </div>
                        <span className="text-xs font-medium text-zinc-600">{task.assignee}</span>
                        {task.status !== 'Completed' && (
                          <button 
                            onClick={() => handleSendReminder(task)}
                            className="p-1 text-zinc-400 hover:text-violet-600 transition-colors ml-auto opacity-0 group-hover:opacity-100"
                            title="Send Reminder"
                          >
                            <Bell size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className={`flex items-center gap-2 text-xs font-medium ${dueStatus === 'overdue' ? 'text-red-600 font-bold' : dueStatus === 'soon' ? 'text-orange-600 font-bold' : 'text-zinc-500'}`}>
                        <Calendar size={14} className={dueStatus ? '' : 'text-violet-700'} />
                        <span>{new Date(task.due_date).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${priorityColors[task.priority]}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-500">
                        {task.cost > 0 && (
                          <div className="flex items-center gap-1" title="Estimated Cost">
                            <DollarSign size={12} className="text-violet-600" />
                            <span>Est: ${task.cost}</span>
                          </div>
                        )}
                        {task.time_spent > 0 && (
                          <div className="flex items-center gap-1">
                            <Timer size={12} className="text-orange-600" />
                            <span>{task.time_spent}h</span>
                          </div>
                        )}
                        {!task.cost && !task.time_spent && <span className="text-zinc-300">-</span>}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${
                        task.status === 'Completed' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : task.status === 'In Progress'
                          ? 'bg-blue-50 text-blue-700 border-blue-100'
                          : 'bg-zinc-50 text-zinc-500 border-zinc-100'
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
