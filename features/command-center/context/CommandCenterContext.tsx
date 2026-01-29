import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Agent, ChatMessage } from '../types';
import { runOrchestrator } from '../../../services/geminiService';
import { Bot, Code2, PenTool, Map } from 'lucide-react';

// Initial Agents State
const INITIAL_AGENTS: Agent[] = [
    {
        id: 'alpha',
        name: 'Alpha',
        role: 'Orchestrator',
        description: 'System Management & Delegation',
        status: 'idle',
        color: 'emerald',
        iconName: 'Bot'
    },
    {
        id: 'builder',
        name: 'Builder',
        role: 'Engineering',
        description: 'Frontend & System Config',
        status: 'idle',
        color: 'blue',
        iconName: 'Code2'
    },
    {
        id: 'scribe',
        name: 'Scribe',
        role: 'Content',
        description: 'Copywriting & Narrative',
        status: 'idle',
        color: 'purple',
        iconName: 'PenTool'
    },
    {
        id: 'atlas',
        name: 'Atlas',
        role: 'Geospatial',
        description: 'Maps, Routes & POI Data',
        status: 'idle',
        color: 'orange',
        iconName: 'Map'
    }
];

interface CommandCenterContextType {
    agents: Agent[];
    messages: ChatMessage[];
    sendMessage: (text: string) => Promise<void>;
    isProcessing: boolean;
}

const CommandCenterContext = createContext<CommandCenterContextType | undefined>(undefined);

export const CommandCenterProvider = ({ children }: { children: ReactNode }) => {
    const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
    const [messages, setMessages] = useState<ChatMessage[]>([{
        id: 'init',
        sender: 'system',
        text: "Alpha System v2.1 online. Neural link established. Ready for command.",
        timestamp: new Date()
    }]);
    const [isProcessing, setIsProcessing] = useState(false);

    const updateAgentStatus = (id: string, status: Agent['status'], task?: string) => {
        setAgents(prev => prev.map(a => a.id === id ? { ...a, status, task } : a));
    };

    const sendMessage = useCallback(async (text: string) => {
        // 1. Add User Message
        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            sender: 'user',
            text,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);
        setIsProcessing(true);

        try {
            // 2. Call Orchestrator
            updateAgentStatus('alpha', 'working', 'Processing command...');
            const response = await runOrchestrator(text);
            updateAgentStatus('alpha', 'idle');

            // 3. Add Alpha's Reply
            const alphaMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                sender: 'system',
                text: response.reply,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, alphaMsg]);

            // 4. Handle Delegations
            if (response.delegations && response.delegations.length > 0) {
                response.delegations.forEach((delegation, index) => {
                    // Assign task
                    updateAgentStatus(delegation.agentId, 'working', delegation.taskDescription);

                    // Simulate Work (Random duration between 3-6 seconds)
                    setTimeout(() => {
                        updateAgentStatus(delegation.agentId, 'done', 'Task Completed');

                        // Optional: Add a "Done" message from the agent
                        setMessages(prev => [...prev, {
                            id: `done-${Date.now()}-${index}`,
                            sender: 'agent',
                            agentName: delegation.agentId.charAt(0).toUpperCase() + delegation.agentId.slice(1),
                            text: `Task complete: ${delegation.taskDescription}`,
                            timestamp: new Date()
                        }]);

                        // Reset to idle after a bit
                        setTimeout(() => {
                            updateAgentStatus(delegation.agentId, 'idle');
                        }, 3000);

                    }, 3000 + (index * 1500));
                });
            }

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                id: 'err-' + Date.now(),
                sender: 'system',
                text: "Critical Error: Connection to neural core failed.",
                timestamp: new Date()
            }]);
            updateAgentStatus('alpha', 'idle');
        } finally {
            setIsProcessing(false);
        }
    }, []);

    return (
        <CommandCenterContext.Provider value={{ agents, messages, sendMessage, isProcessing }}>
            {children}
        </CommandCenterContext.Provider>
    );
};

export const useCommandCenter = () => {
    const context = useContext(CommandCenterContext);
    if (!context) throw new Error('useCommandCenter must be used within a CommandCenterProvider');
    return context;
};
