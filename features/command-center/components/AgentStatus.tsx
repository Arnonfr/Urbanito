import React from 'react';
import { Bot, Code2, PenTool, Map, Activity } from 'lucide-react';
import { useCommandCenter } from '../context/CommandCenterContext';

const IconMap: Record<string, React.ReactNode> = {
    'Bot': <Bot size={24} />,
    'Code2': <Code2 size={24} />,
    'PenTool': <PenTool size={24} />,
    'Map': <Map size={24} />
};

export const AgentStatus = () => {
    const { agents } = useCommandCenter();

    return (
        <div className="h-full overflow-y-auto p-8 bg-gray-50/50">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-8 tracking-tight font-sans">Active Agents</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {agents.map((agent) => (
                        <div key={agent.id} className="group relative bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">

                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105
                  ${agent.role === 'Orchestrator' ? 'bg-emerald-500' :
                                        agent.role === 'Engineering' ? 'bg-blue-500' :
                                            agent.role === 'Content' ? 'bg-purple-500' : 'bg-orange-500'}`}>
                                    {IconMap[agent.iconName]}
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 border
                  ${agent.status === 'working'
                                        ? 'bg-amber-50 text-amber-600 border-amber-100'
                                        : agent.status === 'done'
                                            ? 'bg-green-50 text-green-600 border-green-100'
                                            : 'bg-gray-50 text-gray-500 border-gray-100'
                                    }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full 
                    ${agent.status === 'working' ? 'bg-amber-500 animate-pulse'
                                            : agent.status === 'done' ? 'bg-green-500'
                                                : 'bg-gray-400'}`}></span>
                                    {agent.status}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">{agent.name}</h3>
                                <p className="text-indigo-600 text-sm font-medium mb-3">{agent.role}</p>
                                <p className="text-gray-500 text-sm leading-relaxed">{agent.description}</p>
                            </div>

                            {(agent.status === 'working' || agent.status === 'done') && agent.task && (
                                <div className="mt-6 pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wider">
                                        <Activity size={12} className={agent.status === 'working' ? "text-amber-500 animate-spin" : "text-green-500"} />
                                        {agent.status === 'working' ? 'Current Task' : 'Last Completed'}
                                    </div>
                                    <div className={`p-3 rounded-lg border text-xs font-medium truncate
                     ${agent.status === 'working'
                                            ? 'bg-amber-50 border-amber-100 text-amber-800'
                                            : 'bg-green-50 border-green-100 text-green-800'}`}>
                                        {agent.task}
                                    </div>
                                </div>
                            )}

                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
