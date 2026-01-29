import React, { useState } from 'react';
import { Terminal, Users, Activity, Command, LayoutDashboard } from 'lucide-react';
import { AgentStatus } from '../components/AgentStatus';
import { ChatConsole } from '../components/ChatConsole';
import { CommandCenterProvider } from '../context/CommandCenterContext';

export const CommandCenterPage = () => {
    return (
        <CommandCenterProvider>
            <CommandCenterLayout />
        </CommandCenterProvider>
    );
}

const CommandCenterLayout = () => {
    const [activeTab, setActiveTab] = useState<'console' | 'agents' | 'tasks'>('console');

    return (
        <div className="fixed inset-0 z-[9999] bg-gray-50 text-gray-800 font-sans flex flex-col overflow-hidden">

            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                        <LayoutDashboard className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Urbanito <span className="text-indigo-600">Admin</span></h1>
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            System Online
                        </div>
                    </div>
                </div>

                <div className="flex gap-8 text-sm font-medium text-gray-600">
                    <div className="flex flex-col items-end hidden md:flex">
                        <span className="text-xs text-gray-400 uppercase">Agents</span>
                        <span className="text-indigo-600 font-bold">4 Active</span>
                    </div>
                    <div className="flex flex-col items-end hidden md:flex">
                        <span className="text-xs text-gray-400 uppercase">CPU</span>
                        <span className="text-emerald-600 font-bold">12%</span>
                    </div>
                </div>
            </header>

            {/* Main Container - Centered Limit */}
            <div className="flex-1 flex overflow-hidden max-w-7xl w-full mx-auto bg-white shadow-xl my-8 rounded-2xl border border-gray-200">

                {/* Sidebar Navigation */}
                <nav className="w-20 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-6 gap-4">
                    <NavButton
                        active={activeTab === 'console'}
                        onClick={() => setActiveTab('console')}
                        icon={<Terminal size={22} />}
                        label="Console"
                    />
                    <NavButton
                        active={activeTab === 'agents'}
                        onClick={() => setActiveTab('agents')}
                        icon={<Users size={22} />}
                        label="Agents"
                    />
                    <NavButton
                        active={activeTab === 'tasks'}
                        onClick={() => setActiveTab('tasks')}
                        icon={<Activity size={22} />}
                        label="Tasks"
                    />
                </nav>

                {/* Content Area */}
                <div className="flex-1 flex flex-col relative bg-white">
                    {activeTab === 'console' && <ChatConsole />}
                    {activeTab === 'agents' && <AgentStatus />}
                    {activeTab === 'tasks' && (
                        <div className="flex-1 flex items-center justify-center text-gray-400 font-medium bg-gray-50">
                            Task Board Module Offline
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
    <button
        onClick={onClick}
        className={`p-3 rounded-xl transition-all duration-200 group relative ${active ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
        title={label}
    >
        {icon}
        {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full w-1 h-8 bg-indigo-600 rounded-r-full" />}
    </button>
);
